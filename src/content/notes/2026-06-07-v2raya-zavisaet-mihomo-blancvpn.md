---
title: "v2raya зависает: миграция на mihomo для подписки BlancVPN (Linux)"
date: 2026-06-07
category: "Инженерия"
tags: ["VPN", "Linux", "mihomo", "v2raya", "Сети"]
type: "Тех.решение"
description: "v2raya висит и течёт по памяти. Перешёл на mihomo: 48 МБ RAM против 9 ГБ, один YAML вместо 350 строк bash-watchdog."
---

# v2raya зависает: миграция на mihomo для подписки BlancVPN (Linux)

v2raya висит. На Ubuntu, на роутерах OpenWRT, на VPS — история одна: канал раз в день тихо умирает, snap-сборка течёт по памяти, узлы в балансировщике числятся живыми, а трафик уже никуда не идёт. У меня на ней полгода крутилась подписка BlancVPN. Плюс 350 строк собственного bash-watchdog поверх API v2raya, чтобы хоть как-то лечить симптомы.

Сегодня выкинул всё — и watchdog, и v2raya, и переехал на **mihomo** (бывший Clash Meta). 48 мегабайт RAM против девяти гигабайт. Один YAML-конфиг вместо пяти файлов состояния в `/run/`. Ни одного bash-костыля.

Дальше — почему старая схема не чинится и как выглядит новая. Конфиги собраны под Ubuntu; на macOS схема должна работать так же с парой правок, лично не проверял.

## Что было: v2raya и тихие висяки

v2raya — это GUI поверх Xray-core. Принимает подписку, держит балансировщик, выдаёт SOCKS5 на 20170 и HTTP-прокси на 20171. На бумаге всё хорошо: подписка обновляется, узлы пингуются, активный сервер виден в веб-морде на :2017.

На практике канал раз в день молча умирал. Узел в балансировщике числился живым, но TCP-сессии никуда не шли. Это надо понимать: «висит» — это не «отключился». Отключение systemd видит и рестартует. Висяк — это когда сокет открыт, TLS handshake вроде прошёл, а пакеты внутри тоннеля никто не читает.

Я написал watchdog. Простая идея:

- каждые 3 секунды — `curl --socks5 127.0.0.1:20170 http://cp.cloudflare.com/generate_204`;
- два фейла подряд — логинимся в API v2raya на `127.0.0.1:2017`, дёргаем `/api/httpLatency` по всем серверам подписки, выбираем минимальный RTT, переключаем;
- параллельно фоновый ranker раз в 30 секунд пересобирает рейтинг в tmpfs, чтобы fast path не делал live probe в момент паники;
- если API лёг — `systemctl restart snap.v2raya.v2raya.service`.

Работало. Триста пятьдесят строк bash, пять файлов состояния в `/run/v2raya-watchdog/`, токен с TTL, эвакуация прошлого сервера из balance group через `DELETE /api/connection` (потому что POST там не заменяет, а **дописывает** — узнал на четвёртом часу дебага). И всё ради того, чтобы прикрыть три бага апстрима.

## Почему ушло

**Тред-лик в snap-сборке.** После 50+ переключений процесс v2raya уходил в OOM. В логах хорошо видно: 18:22:32 — `evicting → switch → canary fail → switch` каждые 5–8 секунд, через минуту systemd убивает по таймауту. Issue #1828 на гитхабе, апстрим висит.

**TCP-only health check.** Observatory в Xray-core определяет «жив» по TCP connect, а не по валидности HTTP-ответа. ТСПУ в России дропает TLS ClientHello, но TCP-рукопожатие проходит. Для Observatory — узел жив. Для меня — канал в дыре. Issue #5908.

**Cooldown race.** После API-switch новый VLESS+TLS handshake занимал 2–5 секунд. Мой cooldown — 5. Канарейка успевала уйти в провал ровно посреди handshake, считала fail, дёргала следующий switch. Бесконечный цикл переключений на пустом месте.

**Апстрим не починит.** Автор v2raya в Discussion #1846 явно отказался добавлять авто-пик. Значит, костыль навсегда.

И тут до меня дошло: я полгода чиню в bash то, что в Clash Meta лечится двумя строками yaml.

## Чем заменил: mihomo

mihomo — это форк Clash Meta. Один бинарь, один конфиг, один systemd-юнит. Принимает ту же подписку BlancVPN как `proxy-provider`. TUN-режим — встроенный, на уровне ядра, без `iptables`-плясок. RAM в стабильной нагрузке — 48 мегабайт.

Три ключевых строчки против всего моего bash:

```yaml
proxy-groups:
  - name: PROXY
    type: url-test
    use: [blanc]
    url: "https://www.gstatic.com/generate_204"
    interval: 60
    expected-status: 204          # <- лечит баг Observatory
    interrupt-exist-connections: true  # <- лечит silent hang
    max-failed-times: 3
```

`expected-status: 204` валидирует код ответа, а не сам факт TCP-сессии. Дроп TLS ТСПУ больше не считается успехом. Issue Observatory снят прямо тут.

`interrupt-exist-connections: true` — при смене активного узла рвёт зависшие TCP. Это лекарство от silent hang на уровне ядра, не на уровне моего bash. Watchdog становится не нужен в принципе.

Три года на v2raya — снёс в пять команд.

## Конфиг по частям

Полный файл — `/etc/mihomo/config.yaml`. Зеркало в репозитории — `~/projects/personal-os/ops/mihomo/config.yaml`. Дальше — то, что не дефолт.

**TUN на уровне ядра.** Заменяет v2raya'ный tproxy. `auto-route: true` сам пишет таблицы маршрутизации, `dns-hijack` ловит весь DNS-трафик и пускает через свой резолвер.

```yaml
tun:
  enable: true
  stack: system
  device: utun0
  auto-route: true
  auto-redirect: true
  auto-detect-interface: true
  dns-hijack: [any:53]
  strict-route: true
```

**Сплит DNS.** Российские домены — через Яндекс (77.88.8.8), иностранные — через DoH Cloudflare/Google в обход через прокси. `fake-ip` — чтобы не светить реальные адреса до момента маршрутизации:

```yaml
dns:
  enabled: true
  enhanced-mode: fake-ip
  nameserver: [77.88.8.8, 77.88.8.1]
  fallback:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: RU
```

Зачем сплит DNS: если резолвить `gosuslugi.ru` через Cloudflare, ты получишь иностранный CDN-узел и через секунду — баннер «доступ только из России». То же самое со Сбером и Тинькофф. Антифрод сейчас глядит и на IP, и на DNS-резолвер.

**Подписка как провайдер.** BlancVPN отдаёт HTTPS-урл со списком серверов в Clash-формате. mihomo сам обновляет раз в сутки и пингует каждый узел раз в минуту:

```yaml
proxy-providers:
  blanc:
    type: http
    url: "BLANCVPN_SUBSCRIPTION_URL"  # вставить настоящий
    interval: 86400
    health-check:
      enable: true
      url: "https://www.gstatic.com/generate_204"
      interval: 60
      expected-status: 204
      timeout: 5000
```

**RU split-routing.** Самое важное и самое ручное место. На апрель 2026 Яндекс, ВК, Сбер, Тинькофф, Озон, WB, Авито, HH, Госуслуги все жёстко детектят VPN и режут функции, если видят чужой IP. Поэтому российские домены идут DIRECT — мимо тоннеля, через реальный российский IP:

```yaml
rules:
  - DOMAIN-SUFFIX,gosuslugi.ru,DIRECT
  - DOMAIN-SUFFIX,nalog.ru,DIRECT
  - DOMAIN-SUFFIX,sberbank.ru,DIRECT
  - DOMAIN-SUFFIX,tinkoff.ru,DIRECT
  - DOMAIN-SUFFIX,yandex.ru,DIRECT
  - DOMAIN-SUFFIX,vk.com,DIRECT
  - DOMAIN-SUFFIX,ozon.ru,DIRECT
  - DOMAIN-SUFFIX,wildberries.ru,DIRECT
  - DOMAIN-SUFFIX,avito.ru,DIRECT
  # ...полный список — банки, телеком, госуслуги, маркетплейсы

  - RULE-SET,category-ru,DIRECT  # geosite от MetaCubeX, ~10к доменов RU
  - GEOIP,RU,DIRECT,no-resolve
  - MATCH,PROXY                  # всё остальное — в BlancVPN
```

Первые три правила (CIDR-блоки локальной сети) — `127.0.0.0/8`, `10.0.0.0/8` и т.д. — обязательны, иначе TUN съест и локальный трафик к роутеру.

## Systemd + capabilities

```ini
[Service]
Type=simple
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH CAP_DAC_OVERRIDE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH CAP_DAC_OVERRIDE
Restart=always
ExecStart=/usr/local/bin/mihomo -d /etc/mihomo
```

`CAP_NET_ADMIN` нужен для создания TUN-интерфейса, `CAP_NET_BIND_SERVICE` — чтобы слушать :53 без рута. От `User=root` я ушёл сразу: capabilities точечно дают только то, что нужно.

## Aliases вместо тыка в трей

Под капотом у mihomo есть HTTP API на `127.0.0.1:9090`. Через него можно дёргать конфиг без рестарта сервиса. У меня в `~/.bashrc` подгружается:

```bash
. ~/projects/personal-os/ops/dotfiles/vpn-aliases.sh
```

Команды:

- `vpn-off` — переключить mihomo в `direct` mode за миллисекунды, без sudo. TUN остаётся, но правила игнорируются — весь трафик идёт мимо VPN.
- `vpn-on` — вернуть `rule` mode (BlancVPN активен, RU split работает).
- `vpn-global` — `global` mode, всё в тоннель, даже RU-сайты. Для отладки маршрутов.
- `vpn-status` — режим, выбранный узел, реальный внешний IP через ifconfig.io. Один глаз — и понятно, где я.
- `vpn-restart`, `vpn-stop`, `vpn-start` — sudo, для крайних случаев.
- `vpn-log` — `journalctl -u mihomo -f`.

`vpn-off` важнее всех. Подавляющее большинство случаев, когда я раньше лез в трей v2raya — это «выключи VPN на 30 секунд, проверь что-то на нативном IP». Теперь это одна команда без пароля, без рестарта, без потери открытых соединений.

## А на macOS?

Сам не проверял — у меня основная машина под Ubuntu. По документации и чужим конфигам схема та же, с тремя поправками:

- **Установка** — `brew install mihomo`. Apple Silicon и Intel поддержаны.
- **TUN** — в `tun:` убрать `auto-redirect: true` (это про Linux nftables/eBPF, на macOS игнорируется). `stack: system` оставить или поменять на `mixed` — на macOS 17 второй вариант стабильнее с FaceTime/iCloud.
- **Сервис** — вместо systemd-юнита нужен launchd-plist в `/Library/LaunchDaemons/com.user.mihomo.plist` с `RunAtLoad`, `KeepAlive.NetworkState` и запуском от root. `CapabilityBoundingSet` на macOS не существует. После первого запуска — разрешить Network Extension в `System Settings → Privacy & Security`.

Откат на v2raya через snap, понятно, не сработает: snap-а на macOS нет, на маке v2raya ставится отдельно через `brew install v2raya`.

Всё остальное — конфиг, правила, DNS-сплит, aliases через API на `127.0.0.1:9090` — переносится один в один. Если кто-то прогонит на маке и поправит детали — буду благодарен.

## Что осталось от старой жизни

snap v2raya я не удалил. Запасной парашют: если завтра mihomo внезапно сломается, две команды возвращают старую схему:

```bash
sudo systemctl disable --now mihomo
sudo systemctl start snap.v2raya.v2raya
```

Bash-watchdog уехал в `~/projects/personal-os/archive/v2raya-watchdog-2026-06-07/` с README. Это полезный артефакт — не как код, а как урок. В нём видно, на каком этапе я перестал чинить симптом и пошёл смотреть, что внизу. Слишком поздно.

## Цифры

| | v2raya + watchdog | mihomo |
|---|---|---|
| RAM в стабильной нагрузке | 180 МБ | 48 МБ |
| RAM после 50+ переключений | 9 ГБ (OOM) | 48 МБ |
| Строк bash сверху | 350 | 0 |
| Файлов состояния в `/run` | 5 | 0 |
| Health check | TCP-only (баг) | HTTP 204 |
| Switch при висяке | watchdog через API | встроенный `interrupt-exist-connections` |
| Время на «выключи VPN на минуту» | три клика в трее | `vpn-off` |

## Что скормить агенту, чтобы он сделал всё за вас

Полгода назад я бы этого не писал — слишком много мелких выборов, агент заблудился бы на втором YAML-блоке. В 2026 — собирает за один проход, если дать достаточно ограничений. Подойдёт Claude Code, Codex CLI или любой агент с доступом к Bash и записи в `/etc`.

Подставьте URL подписки в первой строке и отдайте промпт:

````
Задача: настроить mihomo (Clash Meta) на Ubuntu/Debian как прозрачный VPN-клиент
для подписки в Clash-формате. Заменяем v2raya. Цель — авто-фейловер по url-test,
сплит для российских сервисов, минимум RAM, без bash-костылей.

Подписка (Clash/Mihomo формат): <ВСТАВИТЬ_HTTPS_URL>
ОС: Ubuntu 22.04+ или Debian 12+, есть sudo.

Сделать:

1. Скачать последний релиз mihomo с github.com/MetaCubeX/mihomo/releases
   (linux-amd64, или -compatible для старых CPU). Положить в /usr/local/bin/mihomo,
   chmod +x. Проверить `mihomo -v`.

2. Сгенерировать /etc/mihomo/config.yaml:
   - mixed-port: 7890, external-controller: 127.0.0.1:9090, ipv6: false
   - tun: enable true, stack system, auto-route, auto-redirect,
     auto-detect-interface, strict-route, dns-hijack [any:53], device utun0
   - dns: enhanced-mode fake-ip; nameserver — 77.88.8.8 и 77.88.8.1;
     fallback — DoH dns.cloudflare.com и dns.google через прокси;
     fallback-filter: geoip true, geoip-code RU + домены google/youtube/github/
     openai/anthropic/claude.ai/telegram/discord
   - proxy-providers blanc: type http, url из подписки, interval 86400,
     health-check на https://www.gstatic.com/generate_204,
     expected-status 204, interval 60, timeout 5000
   - proxy-groups PROXY: type url-test над provider blanc,
     expected-status 204, interrupt-exist-connections: true,
     max-failed-times 3, lazy false, interval 60, tolerance 100
   - rule-providers category-ru: geosite category-ru.mrs от
     MetaCubeX/meta-rules-dat (format mrs)
   - rules: локальные CIDR (127/8, 10/8, 172.16/12, 192.168/16) DIRECT;
     явные DOMAIN-SUFFIX DIRECT для российских сервисов — gosuslugi.ru,
     nalog.ru, mos.ru, sberbank.ru, tinkoff.ru, vtb.ru, alfabank.ru,
     yandex.ru/net, vk.com, mail.ru, ok.ru, ozon.ru, wildberries.ru,
     avito.ru, hh.ru, cian.ru, 2gis.ru, auto.ru, kinopoisk.ru,
     mts.ru, megafon.ru, beeline.ru, tele2.ru; затем RULE-SET category-ru DIRECT;
     GEOIP RU DIRECT; MATCH PROXY

3. /etc/systemd/system/mihomo.service: Type=simple, Restart=always, RestartSec=5,
   ExecStart=/usr/local/bin/mihomo -d /etc/mihomo.
   CapabilityBoundingSet и AmbientCapabilities:
   CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_TIME CAP_SYS_PTRACE
   CAP_DAC_READ_SEARCH CAP_DAC_OVERRIDE.
   БЕЗ User=root — capabilities дают достаточно.

4. ~/bin/vpn-aliases.sh с алиасами через mihomo API 127.0.0.1:9090:
   vpn-on (PUT /configs mode rule), vpn-off (mode direct), vpn-global,
   vpn-status (mode + /proxies/PROXY .now + curl ifconfig.io),
   vpn-restart/stop/start, vpn-log (journalctl -fu mihomo).
   Подключить в ~/.bashrc одной строкой.

Перед стартом: `mihomo -t -d /etc/mihomo` должен пройти без ошибок.
Если :53 занят systemd-resolved — отключить DNSStubListener в
/etc/systemd/resolved.conf и рестартовать resolved.

Если на хосте уже стоит v2raya — не удалять, но `sudo systemctl disable --now
snap.v2raya.v2raya` (или соответствующий юнит). Это запасной парашют.

Проверка после старта:
  systemctl is-active mihomo               # active
  curl -s 127.0.0.1:9090/proxies/PROXY | jq .now   # непустой узел
  curl -s https://ifconfig.io              # IP не российский
  curl -s https://gosuslugi.ru -o /dev/null -w '%{http_code}\n'  # 200, сплит работает

Ограничения:
  - external-controller — только 127.0.0.1, наружу не открывать
  - ipv6 выключен, на TUN он часто шумит
  - не делать `User=root` в юните

На выходе вывести: путь к конфигу, команду горячей перезагрузки
(`curl -X PUT 127.0.0.1:9090/configs?force=true -d '{"path":"/etc/mihomo/config.yaml"}'`),
команду отката на v2raya.
````

После применения проверьте руками: Яндекс — с российского IP, любой заблокированный ресурс — через тоннель. Оба условия выполнены — готово.

## Что дальше

Подписка BlancVPN — около двух долларов в месяц. Подойдёт любая Clash-совместимая. На том же конфиге можно завести и собственный VLESS-узел: в `proxy-providers` добавляется `type: file`, в файле — серверы напрямую. Это уже другая статья.

Если у вас сейчас работает v2raya и не висит — не трогайте. Это «не сломалось — не лезь». Сломается — теперь есть, на что менять без двух недель чтения wiki MetaCubeX.

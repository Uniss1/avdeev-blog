export function formatDate(date: Date, format: 'short' | 'full' = 'short'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (format === 'short') return `${day}.${month}`;
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

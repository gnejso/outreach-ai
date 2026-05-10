export function hasWebsite(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (str === '') return false;
  const falseValues = ['nie', 'no', 'brak', '-', '0', 'false', 'n/a', 'na', 'none', 'nd', 'brak strony'];
  if (falseValues.includes(str.toLowerCase())) return false;
  return str.length > 0;
}

export function getWebsiteUrl(value: unknown): string | null {
  if (!hasWebsite(value)) return null;
  return String(value).trim();
}

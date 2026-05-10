export function parseReviewCount(value: any): number {
  if (!value) return 0;
  const str = String(value).trim();
  // Handle (90) format
  const parenMatch = str.match(/\((\d+)\)/);
  if (parenMatch) return parseInt(parenMatch[1]);
  // Handle plain number
  const numMatch = str.match(/\d+/);
  if (numMatch) return parseInt(numMatch[0]);
  return 0;
}

export function parseRating(value: any): number | null {
  if (!value) return null;
  const str = String(value).replace(',', '.').trim();
  const match = str.match(/\d+\.?\d*/);
  if (match) {
    const num = parseFloat(match[0]);
    if (num >= 1 && num <= 5) return num;
  }
  return null;
}

export function hasWebsite(value: any): boolean {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (str === '') return false;
  const falseValues = ['nie', 'no', 'brak', '-', '0', 'false', 'n/a', 'na', 'none', ''];
  if (falseValues.includes(str.toLowerCase())) return false;
  // Any non-empty value including non-highlighted links = has website
  return str.length > 0;
}

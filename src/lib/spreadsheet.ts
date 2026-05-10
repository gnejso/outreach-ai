import * as XLSX from "xlsx";
import { CompanyRow, ColumnMapping } from "@/types";
import { parseReviewCount, parseRating, hasWebsite } from "@/lib/utils/parseReviews";

export function parseSpreadsheet(buffer: Buffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });
  return data;
}

// Parse a cell that might contain "(90) 4.8", "90", "4.8", "(90)", etc.
// Returns { reviews: number, rating: number | undefined }
export function parseReviewsCell(raw: string): { reviews: number; rating: number | undefined } {
  const s = raw.trim();

  // Pattern: "(COUNT) RATING" e.g. "(90) 4.8" or "(90) 4,8"
  const combined = s.match(/\((\d+)\)\s*([\d.,]+)/);
  if (combined) {
    const reviews = parseReviewCount(combined[1]);
    const rating = parseRating(combined[2]);
    return { reviews, rating: rating ?? undefined };
  }

  // Pattern: just "(COUNT)" e.g. "(90)"
  const reviews = parseReviewCount(s);
  if (reviews > 0) {
    return { reviews, rating: undefined };
  }

  // If value looks like a rating (e.g. "4.8", "4,8" — has decimal, ≤ 5.0)
  const rating = parseRating(s);
  if (rating !== null) {
    return { reviews: 0, rating };
  }

  return { reviews: 0, rating: undefined };
}

// Detect website: URL, domain, or yes/tak/true
export function parseWebsiteCell(raw: string): boolean {
  return hasWebsite(raw);
}

export function mapColumns(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): CompanyRow[] {
  return rows.map((row) => {
    // Reviews + rating: first check dedicated rating column, then parse reviews cell
    const reviewsRaw = String(row[mapping.reviews] ?? "");
    const parsedReviews = parseReviewsCell(reviewsRaw);

    // If there's a separate rating column, it wins over anything parsed from reviews
    let rating: number | undefined = parsedReviews.rating;
    if (mapping.rating) {
      const ratingRaw = String(row[mapping.rating] ?? "").replace(",", ".");
      const ratingVal = parseFloat(ratingRaw);
      if (!isNaN(ratingVal) && ratingVal > 0) rating = ratingVal;
    }

    // Website: use dedicated column if mapped, otherwise undefined
    let hasWebsite: boolean | undefined;
    if (mapping.hasWebsite) {
      hasWebsite = parseWebsiteCell(String(row[mapping.hasWebsite] ?? ""));
    }

    // websiteUrl: raw cell value (SMS route resolves hasWebsite from it)
    const websiteUrl = mapping.websiteUrl ? String(row[mapping.websiteUrl] ?? "") : undefined;

    return {
      name: String(row[mapping.name] ?? ""),
      phone: String(row[mapping.phone] ?? ""),
      reviews: parsedReviews.reviews,
      rating,
      industry: mapping.industry ? String(row[mapping.industry] ?? "") : undefined,
      hasWebsite,
      websiteUrl,
      city: mapping.city ? String(row[mapping.city] ?? "") : undefined,
      purpose: mapping.purpose ? String(row[mapping.purpose] ?? "") : undefined,
    };
  });
}

export function getColumns(rows: Record<string, string>[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}

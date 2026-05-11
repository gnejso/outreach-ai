export type Role = "USER" | "ADMIN";
export type Tier = "FREE" | "TIER1" | "TIER2" | "TIER3" | "ADMIN";
export type ActivityType =
  | "COLD_CALL_SCRIPT"
  | "SMS_CONTENT"
  | "SMS_SEND"
  | "CREDITS_PURCHASE"
  | "SUBSCRIPTION_RENEWAL"
  | "STATUS_CHANGE"
  | "NOTE_SAVED"
  | "SCRAPER_USE"
  | "OFERTA_UMOWA"
  | "JASKINIA_UNLOCK"
  | "WEB_AUDIT";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  tier: Tier;
  credits: number;
  freeScripts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  creditsUsed: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CompanyRow {
  name: string;
  phone: string;
  reviews: number;
  rating?: number;
  industry?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  city?: string;
  purpose?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ColdCallScript {
  company: CompanyRow;
  script: string;
}

export interface SmsContent {
  company: CompanyRow;
  message: string;
  status?: "pending" | "sent" | "failed";
}

export interface ColumnMapping {
  name: string;
  phone: string;
  reviews: string;
  rating?: string;
  industry?: string;
  hasWebsite?: string;
  websiteUrl?: string;
  city?: string;
  purpose?: string;
}

export interface CreditCost {
  COLD_CALL_SCRIPT: 4;
  SMS_CONTENT: 3;
  SMS_SEND: 10;
  SCRAPER_COMPANY: 2;
  OFERTA_UMOWA: 25;
}

export const CREDIT_COSTS: CreditCost = {
  COLD_CALL_SCRIPT: 4,
  SMS_CONTENT: 3,
  SMS_SEND: 10,
  SCRAPER_COMPANY: 2,
  OFERTA_UMOWA: 25,
};

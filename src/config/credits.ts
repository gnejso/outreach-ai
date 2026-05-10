// src/config/credits.ts
export const ADMIN_EMAIL = "janmikolajczak77@gmail.com";

export const CREDIT_COSTS = {
  COLD_CALL_SCRIPT: 4,
  SMS_CONTENT: 3,
  SMS_SEND: 10,
  SCRAPER_COMPANY: 2, // 2 kredyty za 1 firmę ze scrapera (bez suba)
  OFERTA_UMOWA: 25, // Generator ofert i umów
} as const;

export const SCRAPER_LIMITS = {
  FREE: 0, // Bez dostępu do scrapera
  TIER1: 50, // 50 firm dziennie
  TIER2: 75, // 75 firm dziennie
  TIER3: 125, // 125 firm dziennie
  ADMIN: 999, // Nielimitowany
} as const;

export const WELCOME_BONUS = {
  credits: 75,
  freeScripts: 11,
} as const;

export const SUBSCRIPTION_TIERS = [
  {
    id: "TIER1",
    name: "Starter",
    emoji: "🥈",
    price: 25,
    credits: 400,
    color: "#1A6BDD",
    stripe_price_id: "",
    features_yes: [
      "📞 Cold Call Skrypty AI",
      "💬 Generowanie treści SMS",
      "📤 Wysyłka SMS (Twilio)",
      "🗂️ CRM & Notatki po rozmowie",
      "🔔 Follow-up Reminders",
      "📊 Dashboard z analityką",
      "📋 Historia wszystkich sesji",
      "🌐 10 języków interfejsu",
      "🗺️ Google Maps Scraper (50 firm/dzień)",
    ],
    features_no: [
      "⚡ Priorytet AI",
      "♾️ Nielimitowane arkusze",
      "🎯 Dedykowane wsparcie",
    ],
  },
  {
    id: "TIER2",
    name: "Professional",
    emoji: "🥇",
    price: 75,
    credits: 1500,
    color: "#5B4FE8",
    popular: true,
    badge: "NAJPOPULARNIEJSZY",
    stripe_price_id: "",
    features_yes: [
      "✅ Wszystko z planu Starter",
      "🗺️ Google Maps Scraper (75 firm/dzień)",
      "♾️ Nielimitowane arkusze",
      "📁 Eksport PDF & XLSX",
      "🔍 Zaawansowany CRM",
      "📱 Bulk SMS campaigns",
      "⚡ Priorytetowa kolejka AI",
      "📈 Zaawansowane statystyki",
    ],
    features_no: [
      "🚀 Najwyższy priorytet AI",
      "🎯 Dedykowane wsparcie 1:1",
      "🔧 Custom integracje",
    ],
  },
  {
    id: "TIER3",
    name: "Enterprise",
    emoji: "👑",
    price: 150,
    credits: 2500,
    color: "#C9A84C",
    colorEnd: "#E8C96B",
    badge: "PREMIUM",
    stripe_price_id: "",
    features_yes: [
      "✅ Wszystko z planu Professional",
      "🗺️ Google Maps Scraper (125 firm/dzień)",
      "🚀 Najwyższy priorytet AI",
      "🎯 Dedykowane wsparcie 1:1",
      "⚡ Najszybsze generowanie skryptów",
      "🔧 Custom integracje na życzenie",
      "🆕 Early access nowych funkcji",
      "📞 Onboarding call z zespołem",
      "🛡️ SLA gwarancja dostępności",
      "📊 Raporty dla zespołu",
    ],
    features_no: [],
  },
] as const;

export const CREDIT_PACKS = [
  {
    id: "small",
    name: "Mała",
    emoji: "📦",
    price: 20,
    credits: 350,
    color: "#1A6BDD",
    stripe_price_id: "",
  },
  {
    id: "medium",
    name: "Średnia",
    emoji: "💼",
    price: 48,
    credits: 800,
    color: "#2A7FFF",
    stripe_price_id: "",
  },
  {
    id: "large",
    name: "Duża",
    emoji: "🚀",
    price: 80,
    credits: 1800,
    color: "#5B4FE8",
    stripe_price_id: "",
  },
  {
    id: "vip",
    name: "VIP",
    emoji: "💎",
    price: 200,
    credits: 3500,
    color: "#9B59B6",
    stripe_price_id: "",
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    emoji: "🏢",
    price: 500,
    credits: 9000,
    color: "#C9A84C",
    best: true,
    badge: "NAJLEPSZA WARTOŚĆ",
    savings: "Oszczędzasz 40% vs mała paczka",
    note: "Wystarczy na ~2250 skryptów cold call",
    stripe_price_id: "",
  },
] as const;

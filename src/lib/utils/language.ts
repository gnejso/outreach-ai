export const LANGUAGE_MAP: Record<string, string> = {
  pl: "Polish (język polski)",
  en: "English",
  de: "German (Deutsch)",
  fr: "French (Français)",
  es: "Spanish (Español)",
  it: "Italian (Italiano)",
  pt: "Portuguese (Português)",
  nl: "Dutch (Nederlands)",
  cs: "Czech (Čeština)",
  uk: "Ukrainian (Українська)",
};

export function getLanguageInstruction(locale: string): string {
  const lang = LANGUAGE_MAP[locale] || "English";
  return `CRITICAL: Write ENTIRELY in ${lang}. Every word, every sentence must be in ${lang}. Do not mix languages. This is the most important rule.`;
}

export function getLanguageName(locale: string): string {
  return LANGUAGE_MAP[locale] || "English";
}

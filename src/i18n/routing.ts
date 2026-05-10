import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en", "de", "fr", "es", "it", "pt", "nl", "cs", "uk"],
  defaultLocale: "pl",
});

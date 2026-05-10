import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const BUSINESSES: {
  name: string;
  industry: string;
  category: string;
  difficulty: "Łatwy" | "Średni" | "Trudny";
  s1: string; s2: string; s3: string;
}[] = [
  { name: "Agencja Automatyzacji AI (AIA)", industry: "Automatyzacja AI", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling do firm logistycznych", s2: "Wiadomości na LinkedIn", s3: "Darmowe audyty procesów" },
  { name: "Agencja Short-Form Video (TikTok/Reels)", industry: "Marketing Wideo", category: "Marketing", difficulty: "Średni", s1: "Cold SMS do YouTuberów", s2: "DM na Instagramie", s3: "Własne virale na TikToku" },
  { name: "Ghostwriting dla CEO (LinkedIn)", industry: "Content Marketing", category: "Marketing", difficulty: "Średni", s1: "Cold Calling zarządów spółek", s2: "Komentowanie branżowych postów", s3: "Cold Email" },
  { name: "Agencja Reklamowa (Meta/Google Ads)", industry: "Reklama Cyfrowa", category: "Marketing", difficulty: "Średni", s1: "Cold Calling lokalnych usług (dentyści, dachy)", s2: "Case studies", s3: "Darmowe audyty kont reklamowych" },
  { name: "Copywriting Sprzedażowy (Landing Page)", industry: "Copywriting", category: "Marketing", difficulty: "Łatwy", s1: "Cold SMS do właścicieli e-commerce", s2: "Upwork", s3: "Budowa marki na X (Twitter)" },
  { name: "Agencja UGC (User Generated Content)", industry: "Content Marketing", category: "Marketing", difficulty: "Łatwy", s1: "Cold Calling marek kosmetycznych", s2: "Wysyłanie darmowych próbek wideo", s3: "Networking" },
  { name: "Zarządzanie kontami OnlyFans", industry: "Content Creators", category: "Media", difficulty: "Trudny", s1: "Cold SMS do modelek z IG", s2: "Twitter marketing", s3: "Rekomendacje" },
  { name: "Agencja Rekrutacyjna IT / Headhunting", industry: "Rekrutacja IT", category: "HR", difficulty: "Średni", s1: "Cold Calling działów HR", s2: "Sales Navigator (LinkedIn)", s3: "Raporty płacowe jako Lead Magnet" },
  { name: "Wdrażanie Chatbotów Obsługi Klienta", industry: "AI / Chatboty", category: "Technologia", difficulty: "Średni", s1: "Cold Calling klinik medycznych", s2: "Interaktywne demo wysyłane w Cold Emailu", s3: "Webinary" },
  { name: "Agencja Wirtualnych Asystentek", industry: "Outsourcing", category: "Usługi Biznesowe", difficulty: "Łatwy", s1: "Cold Calling zapracowanych przedsiębiorców", s2: "Grupy biznesowe na FB", s3: "Polecenia" },
  { name: "E-commerce: Dropshipping", industry: "E-commerce", category: "Handel", difficulty: "Łatwy", s1: "Cold SMS z porzuconymi koszykami", s2: "Meta Ads", s3: "TikTok Ads" },
  { name: "E-commerce: Marka Odzieżowa (Streetwear)", industry: "Moda", category: "Handel", difficulty: "Średni", s1: "Cold SMS o limitowanych dropach", s2: "Influencer marketing", s3: "Pop-up stores" },
  { name: "Amazon FBA (Private Label)", industry: "E-commerce Amazon", category: "Handel", difficulty: "Trudny", s1: "Cold Calling dostawców B2B", s2: "Optymalizacja SEO na Amazonie", s3: "Amazon PPC" },
  { name: "E-commerce: Suplementy Diety", industry: "Suplementy", category: "Zdrowie", difficulty: "Średni", s1: "Cold Calling siłowni (sprzedaż hurtowa)", s2: "Google Ads", s3: "Współpraca z trenerami" },
  { name: "Print on Demand (Koszulki/Kubki)", industry: "Print on Demand", category: "Handel", difficulty: "Łatwy", s1: "Cold SMS do organizatorów eventów", s2: "Etsy SEO", s3: "Pinterest marketing" },
  { name: "Sprzedaż Produktów Cyfrowych (Plannery)", industry: "Produkty Cyfrowe", category: "Edukacja", difficulty: "Łatwy", s1: "Cold Calling B2B dla paczek pracowniczych", s2: "Instagram Reels", s3: "Reklamy na Pintereście" },
  { name: "Tworzenie Kursów Online dla Twórców", industry: "EdTech", category: "Edukacja", difficulty: "Średni", s1: "Cold Calling influencerów", s2: "Wspólne live'y", s3: "Płatne kampanie Meta" },
  { name: "Reselling Ubrań Vintage", industry: "Vintage / Reselling", category: "Handel", difficulty: "Łatwy", s1: "Cold SMS do stałych klientów z nowymi perełkami", s2: "Vinted/Depop", s3: "TikTok live sales" },
  { name: "Sklep z Produktami Eko/Zero Waste", industry: "Eko / Zero Waste", category: "Zdrowie", difficulty: "Łatwy", s1: "Cold Calling sklepów stacjonarnych (hurt)", s2: "SEO blogowe", s3: "Współpraca z eko-influencerami" },
  { name: "Boxy Subskrypcyjne", industry: "Subskrypcje", category: "Handel", difficulty: "Średni", s1: "Cold SMS z kodem na pierwszy box", s2: "Unboxing wideo", s3: "Programy lojalnościowe" },
  { name: "Trener Personalny Online", industry: "Fitness Online", category: "Zdrowie", difficulty: "Łatwy", s1: "Cold Calling lokalnych firm o pakiety dla pracowników", s2: "Darmowe plany treningowe (Lead Magnet)", s3: "Przemiany na IG" },
  { name: "Coach Relacji / Dating Coach", industry: "Coaching", category: "Edukacja", difficulty: "Średni", s1: "Cold SMS z poradą po zapisie na newsletter", s2: "YouTube shorts", s3: "Grupy wsparcia" },
  { name: "Korepetycje i Nauka Języków Online", industry: "Edukacja Online", category: "Edukacja", difficulty: "Łatwy", s1: "Cold Calling do HR o szkolenia dla firm", s2: "Darmowe lekcje próbne", s3: "SEO lokalne" },
  { name: "Mentoring Programistyczny (Bootcamp)", industry: "Bootcamp IT", category: "Edukacja", difficulty: "Średni", s1: "Cold SMS z zaproszeniem na webinar", s2: "GitHub portfolio review", s3: "YouTube tutoriale" },
  { name: "Konsultant Podatkowy/Księgowość Online", industry: "Księgowość", category: "Finanse", difficulty: "Średni", s1: "Cold Calling nowo założonych firm (CEIDG)", s2: "Artykuły eksperckie", s3: "LinkedIn" },
  { name: "Doradztwo Inwestycyjne/Krypto", industry: "Finanse / Krypto", category: "Finanse", difficulty: "Trudny", s1: "Cold Calling z zaproszeniem do zamkniętej grupy", s2: "Newsletter finansowy", s3: "Twitter Spaces" },
  { name: "High-Ticket Sales Coach (Szkolenia ze sprzedaży)", industry: "Sales Coaching", category: "Edukacja", difficulty: "Trudny", s1: "Cold Calling agencji marketingowych", s2: "Cold Email z analizą ich skryptów", s3: "Publikacje na LinkedIn" },
  { name: "Trener Medytacji / Mindfulness B2B", industry: "Wellbeing B2B", category: "Zdrowie", difficulty: "Średni", s1: "Cold Calling korporacji (działy well-being)", s2: "Podcasty", s3: "Aplikacje B2B" },
  { name: "Nauczyciel Gry na Instrumencie Online", industry: "Muzyka Online", category: "Edukacja", difficulty: "Łatwy", s1: "Cold SMS do uczestników warsztatów", s2: "Cover'y na YouTube", s3: "TikTok" },
  { name: "Ekspert od Promptowania ChatGPT", industry: "AI Prompting", category: "Technologia", difficulty: "Średni", s1: "Cold Calling zarządów z obietnicą cięcia kosztów", s2: "Darmowe bazy promptów na Gumroad", s3: "Webinary" },
  { name: "SaaS: Aplikacja do Rezerwacji Wizyt", industry: "SaaS Beauty", category: "Technologia", difficulty: "Średni", s1: "Cold Calling fryzjerów i kosmetyczek", s2: "Darmowy okres próbny", s3: "Google Ads" },
  { name: "Mikro-SaaS dla Restauracji (Menu QR)", industry: "SaaS Gastro", category: "Technologia", difficulty: "Łatwy", s1: "Cold Calling menedżerów gastro", s2: "Ulotki B2B", s3: "Direct mail" },
  { name: "SaaS: Platforma do Hostingu Kursów", industry: "EdTech SaaS", category: "Technologia", difficulty: "Trudny", s1: "Cold SMS do twórców na Udemy", s2: "Afiliacja", s3: "SEO" },
  { name: "Narzędzie do Analizy SEO (SaaS)", industry: "SEO SaaS", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling agencji marketingowych", s2: "Darmowy mini-audyt strony", s3: "Content marketing" },
  { name: "CRM dla Branży Beauty", industry: "CRM Beauty", category: "Technologia", difficulty: "Średni", s1: "Cold Calling właścicieli salonów", s2: "Demo wideo na Facebooku", s3: "Grupy branżowe na FB" },
  { name: "Tworzenie Wtyczek (Apps) do Shopify", industry: "Shopify Apps", category: "Technologia", difficulty: "Trudny", s1: "Cold SMS do właścicieli e-commerce", s2: "Sklep aplikacji Shopify", s3: "Posty na forach e-commerce" },
  { name: "Edytor Wideo oparty o AI (SaaS)", industry: "AI Video SaaS", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling dużych redakcji", s2: "Product Hunt", s3: "Sponsorowanie YouTuberów" },
  { name: "Aplikacja Fitness/Dietetyczna", industry: "Health App", category: "Zdrowie", difficulty: "Średni", s1: "Cold SMS do porzuconych rejestracji", s2: "App Store Optimization (ASO)", s3: "Meta Ads" },
  { name: "Marketplace dla Freelancerów (Niszowy)", industry: "Marketplace", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling firm szukających podwykonawców", s2: "Cold Email do freelancerów", s3: "LinkedIn" },
  { name: "Niszowe Portale Ogłoszeniowe (np. praca w AI)", industry: "Job Boards", category: "Media", difficulty: "Średni", s1: "Cold Calling startupów tech o darmowe ogłoszenia", s2: "Twitter", s3: "SEO" },
  { name: "Produkcja i Montaż Podcastów", industry: "Podcast Production", category: "Media", difficulty: "Łatwy", s1: "Cold Calling ekspertów z LinkedIn bez podcastu", s2: "Cold Email z darmowym demem audio", s3: "Networking" },
  { name: "Płatne Newslettery (Substack)", industry: "Newsletter", category: "Media", difficulty: "Łatwy", s1: "Cold SMS o promocji crossowej", s2: "Twitter (wątki)", s3: "Występy gościnne u innych" },
  { name: "Projektowanie Miniaturek YouTube", industry: "Design YouTuberów", category: "Kreatywne", difficulty: "Łatwy", s1: "Cold Calling mniejszych twórców", s2: "Przeprojektowanie miniaturki za darmo na próbę", s3: "Portfolio na Twitterze" },
  { name: "Tłumaczenia i Dubbing AI", industry: "AI Tłumaczenia", category: "Usługi Biznesowe", difficulty: "Średni", s1: "Cold Calling amerykańskich twórców by weszli na rynek PL", s2: "Demo z ich głosem", s3: "Upwork" },
  { name: "Moderacja Społeczności (Discord/Skool)", industry: "Community Management", category: "Usługi Biznesowe", difficulty: "Łatwy", s1: "Cold SMS do twórców dużych społeczności", s2: "Udzielanie się na serwerach", s3: "Cold Email" },
  { name: "Organizacja Eventów i Webinarów Online", industry: "Events Online", category: "Usługi Biznesowe", difficulty: "Średni", s1: "Cold Calling korporacji szkoleniowych", s2: "LinkedIn", s3: "Oferty w grupach na FB" },
  { name: "Tworzenie Filtrów AR na Instagram/Snapchat", industry: "AR Filters", category: "Kreatywne", difficulty: "Średni", s1: "Cold Calling agencji PR", s2: "Cold Email do marek modowych", s3: "Portfolio wideo" },
  { name: "Pinterest Management Agency", industry: "Pinterest Marketing", category: "Marketing", difficulty: "Łatwy", s1: "Cold Calling blogerek modowych i sklepów e-com", s2: "SEO na Pintereście", s3: "Darmowe piny na próbę" },
  { name: "Pisanie Skryptów do Wideo na YT (Scriptwriting)", industry: "Scriptwriting", category: "Kreatywne", difficulty: "Łatwy", s1: "Cold SMS do popularnych kanałów", s2: "Analiza ich starych wideo w mailu", s3: "Twitter" },
  { name: "Projektowanie Prezentacji (Pitch Decki)", industry: "Pitch Deck Design", category: "Kreatywne", difficulty: "Średni", s1: "Cold Calling founderów startupów", s2: "LinkedIn", s3: "Portale dla inwestorów (Crunchbase)" },
  { name: "Analiza Danych dla Małych Firm", industry: "Data Analytics", category: "Technologia", difficulty: "Średni", s1: "Cold Calling e-commerce'ów (analiza zysków)", s2: "Darmowe dashboardy w Looker Studio", s3: "LinkedIn" },
  { name: "Cyberbezpieczeństwo dla MŚP", industry: "Cybersecurity", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling firm rachunkowych", s2: "Symulacja ataku phishingowego", s3: "Webinary" },
  { name: "Tworzenie Avatarów AI dla Firm", industry: "AI Avatars", category: "Technologia", difficulty: "Średni", s1: "Cold Calling agencji nieruchomości", s2: "Demo na żywo", s3: "TikTok" },
  { name: "Wynajem Sprzętu Fotograficznego/IT Online", industry: "Wynajem Sprzętu", category: "Usługi Biznesowe", difficulty: "Łatwy", s1: "Cold SMS z kodem rabatowym dla agencji", s2: "SEO Lokalne", s3: "Google Ads" },
  { name: "Konsulting ESG (Zrównoważony Rozwój)", industry: "ESG Consulting", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold Calling firm produkcyjnych", s2: "Artykuły na LinkedIn", s3: "Partnerstwa biznesowe" },
  { name: "Ghost Commerce (Zarabianie bez twarzy na afiliacji)", industry: "Affiliate Marketing", category: "Marketing", difficulty: "Łatwy", s1: "Cold SMS do partnerów B2B", s2: "Piny na Pintereście", s3: "Konta na TikToku (faceless)" },
  { name: "Zarządzanie Najmem Krótkoterminowym (Airbnb online)", industry: "Zarządzanie Airbnb", category: "Nieruchomości", difficulty: "Średni", s1: "Cold Calling właścicieli z Booking.com", s2: "Ulotki", s3: "Google Ads" },
  { name: "Agencja Influencer Marketingowa", industry: "Influencer Marketing", category: "Marketing", difficulty: "Trudny", s1: "Cold Calling marek FMCG", s2: "Baza influencerów jako Lead Magnet", s3: "Eventy" },
  { name: "Tworzenie Muzyki i Dźwięków do Gier (Indie)", industry: "Game Audio", category: "Kreatywne", difficulty: "Średni", s1: "Cold SMS do deweloperów na Discordzie", s2: "Game Jamy", s3: "Twitter" },
  { name: "Doradztwo ds. Pracy Zdalnej (Remote Work Setup)", industry: "Remote Work Consulting", category: "Usługi Biznesowe", difficulty: "Łatwy", s1: "Cold Calling firm tradycyjnych", s2: "LinkedIn", s3: "Darmowy audyt narzędzi" },
  { name: "B2B Lead Generation Agency", industry: "Lead Generation", category: "Sprzedaż", difficulty: "Trudny", s1: "Cold Calling jako główny dowód umiejętności", s2: "Cold Email", s3: "Social Selling na LinkedIn" },
  { name: "Agencja Web Design (Webflow/Framer)", industry: "Web Design", category: "Technologia", difficulty: "Średni", s1: "Cold Calling firm z przestarzałymi stronami", s2: "Projekt homepage'a za darmo", s3: "Dribbble/Behance" },
  { name: "Ochrona Wizerunku w Sieci (Usuwanie negatywnych opinii)", industry: "Reputation Management", category: "Marketing", difficulty: "Trudny", s1: "Cold SMS do firm z oceną <3.5 na Google", s2: "Cold Email z analizą strat", s3: "Prawnicy" },
  { name: "Optymalizacja Wizytówek Google (GBP)", industry: "Google Business Profile", category: "Marketing", difficulty: "Łatwy", s1: "Cold Calling lokalnych rzemieślników", s2: "Darmowy raport widoczności", s3: "Oferty door-to-door" },
  { name: "Budowa Lejków Sprzedażowych (ClickFunnels/GoHighLevel)", industry: "Sales Funnels", category: "Sprzedaż", difficulty: "Średni", s1: "Cold Calling coachów i trenerów", s2: "Budowa darmowego lejka demo", s3: "Facebook Ads" },
  { name: "Tworzenie Aplikacji No-Code (Bubble)", industry: "No-Code Development", category: "Technologia", difficulty: "Średni", s1: "Cold SMS do startupów szukających MVP", s2: "Twitter (build in public)", s3: "Platformy z ogłoszeniami" },
  { name: "Agencja UX/UI Auditing", industry: "UX/UI Auditing", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling sklepów internetowych z porzuconymi koszykami", s2: "Nagrania z darmowym audytem", s3: "LinkedIn" },
  { name: "E-mail Marketing (Klaviyo Management)", industry: "Email Marketing", category: "Marketing", difficulty: "Średni", s1: "Cold Calling marek e-commerce", s2: "Gwarancja wzrostu przychodów % z maili", s3: "Cold Email" },
  { name: "Zarządzanie Kampaniami Crowdfundingowymi (Kickstarter)", industry: "Crowdfunding", category: "Finanse", difficulty: "Trudny", s1: "Cold SMS do twórców na grupach FB", s2: "Agresywny PR", s3: "Webinaria" },
  { name: "Agencja PR dla Branży Tech", industry: "Tech PR", category: "Marketing", difficulty: "Trudny", s1: "Cold Calling nowo sfinansowanych startupów (z bazy Crunchbase)", s2: "Relacje z dziennikarzami", s3: "LinkedIn" },
  { name: "Prowadzenie Kont na TikToku dla Prawników/Lekarzy", industry: "TikTok dla Specjalistów", category: "Marketing", difficulty: "Średni", s1: "Cold Calling kancelarii", s2: "Wideo z przykładami konkurencji", s3: "Branżowe konferencje" },
  { name: "Agencja Community Management (Zarządzanie opiniami)", industry: "Community & Opinie", category: "Marketing", difficulty: "Średni", s1: "Cold SMS do marek B2C", s2: "Narzędzia do monitoringu sieci", s3: "Cold Email" },
  { name: "Zdalny Doradca Finansowy ds. Dotacji Unijnych", industry: "Dotacje UE", category: "Finanse", difficulty: "Trudny", s1: "Cold Calling firm produkcyjnych", s2: "Darmowa wstępna kwalifikacja", s3: "Reklamy Meta" },
  { name: "Tworzenie Brandingu i Logo (Identyfikacja wizualna)", industry: "Branding", category: "Kreatywne", difficulty: "Łatwy", s1: "Cold Calling nowo zarejestrowanych firm (KRS/CEIDG)", s2: "Behance", s3: "Konkursy projektowe" },
  { name: "Agencja Tłumaczeń Medycznych/Technicznych (z użyciem AI)", industry: "Tłumaczenia Specjalistyczne", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold SMS do firm eksportujących", s2: "Branżowe bazy danych", s3: "Targi" },
  { name: "Konsultant ds. Optymalizacji Kosztów Chmurowych (AWS/Azure)", industry: "Cloud Cost Optimization", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling CTO w firmach SaaS", s2: "Darmowy audyt infrastruktury", s3: "LinkedIn" },
  { name: "Zarządzanie Flotą Samochodów (Software/Usługa)", industry: "Fleet Management", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold Calling firm transportowych", s2: "Prezentacja ROI", s3: "Zimne wizyty" },
  { name: "Outsourcing Obsługi Klienta (Call Center as a Service)", industry: "Call Center", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold SMS do e-commerce przed Black Friday", s2: "Próbne darmowe roboczogodziny", s3: "Sieciowanie" },
  { name: "Konsulting ds. Automatyzacji Zapier/Make", industry: "Automatyzacja no-code", category: "Technologia", difficulty: "Średni", s1: "Cold Calling agencji", s2: "Gotowe szablony automatyzacji jako Lead Magnet", s3: "YouTube" },
  { name: "Tworzenie Wirtualnych Spacerów 3D (Matterport)", industry: "Virtual Tours 3D", category: "Kreatywne", difficulty: "Średni", s1: "Cold Calling agencji nieruchomości", s2: "Demo zrobione dla konkurencji", s3: "Bezpośrednie spotkania" },
  { name: "Usługi Wirtualnego Stagingu Nieruchomości", industry: "Virtual Staging", category: "Nieruchomości", difficulty: "Łatwy", s1: "Cold SMS z próbką odświeżonego zdjęcia z ich oferty", s2: "Grupy fliperów", s3: "Instagram" },
  { name: "Audyty Dostępności Stron (WCAG)", industry: "Accessibility / WCAG", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling urzędów i szkół", s2: "Skrypty wysyłające błędy", s3: "Cold Email do IT" },
  { name: "Zarządzanie Projektami jako Usługa (Freelance PM)", industry: "Project Management", category: "Usługi Biznesowe", difficulty: "Średni", s1: "Cold Calling rosnących agencji marketingowych", s2: "Upwork", s3: "LinkedIn" },
  { name: "Agencja Eventowa dla Pracy Zdalnej (Wirtualne integracje)", industry: "Virtual Events HR", category: "HR", difficulty: "Łatwy", s1: "Cold SMS do działów HR", s2: "Krótkie zwiastuny gier online", s3: "Webinary" },
  { name: "Tworzenie Makiet Produktów i Prototypów 3D", industry: "Prototypowanie 3D", category: "Kreatywne", difficulty: "Trudny", s1: "Cold Calling wynalazców/producentów", s2: "Dribbble", s3: "Cold Email do działów R&D" },
  { name: "Doradztwo ds. Skalowania Bazy Danych", industry: "Database Scaling", category: "Technologia", difficulty: "Trudny", s1: "Cold SMS do aplikacji z problemami wydajności", s2: "Blog techniczny", s3: "Twitter" },
  { name: "Konsultacje ds. Monetyzacji Gier F2P", industry: "Game Monetization", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling studiów gier mobilnych", s2: "Analizy rynkowe na LinkedIn", s3: "Konferencje gamedev" },
  { name: "Tworzenie Muzyki do Reklam (Royalty-Free)", industry: "Muzyka Reklamowa", category: "Kreatywne", difficulty: "Łatwy", s1: "Cold Calling agencji wideo", s2: "Wysyłanie darmowych paczek sampli (Cold Email)", s3: "AudioJungle/Pond5" },
  { name: "Agencja Researchu Rynkowego B2B", industry: "Market Research", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold Calling firm wchodzących na nowy rynek", s2: "Darmowy próbny raport", s3: "SEO" },
  { name: "Specjalista ds. Migracji Stron Internetowych", industry: "Web Migration", category: "Technologia", difficulty: "Średni", s1: "Cold SMS do firm z powolnymi stronami", s2: "Fora technologiczne", s3: "Agencje partnerskie" },
  { name: "Konsultant ds. Zarządzania Zmianą w IT", industry: "IT Change Management", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling dużych przedsiębiorstw wdrażających nowe ERP", s2: "Publikacje", s3: "HR networking" },
  { name: "Zarządzanie Kryzysowe w Social Mediach (PR)", industry: "Crisis PR", category: "Marketing", difficulty: "Trudny", s1: "Cold SMS natychmiast do firm będących w trakcie afery/kryzysu", s2: "Agencje matki", s3: "X (Twitter)" },
  { name: "Tworzenie Interaktywnych Kalkulatorów na Strony", industry: "Interactive Tools", category: "Technologia", difficulty: "Średni", s1: "Cold Calling firm pożyczkowych i budowlanych", s2: "Demo w mailu", s3: "SEO" },
  { name: "Usługi Voiceover (Lektor AI i naturalny)", industry: "Voiceover", category: "Kreatywne", difficulty: "Łatwy", s1: "Cold Calling domów produkcyjnych", s2: "Bazy głosów online", s3: "Cold Email z próbką tekstu klienta" },
  { name: "Wdrażanie Systemów ERP dla Małych Firm", industry: "ERP dla MŚP", category: "Technologia", difficulty: "Trudny", s1: "Cold SMS do hurtowni", s2: "Darmowy warsztat z mapowania procesów", s3: "Polecenia" },
  { name: "Doradztwo ds. Optymalizacji Łańcucha Dostaw (E-com)", industry: "Supply Chain E-com", category: "Usługi Biznesowe", difficulty: "Trudny", s1: "Cold Calling dużych e-commerce'ów", s2: "Audyt logistyczny", s3: "LinkedIn" },
  { name: "Pisanie Wniosków o Dotacje na Innowacje", industry: "Dotacje na Innowacje", category: "Finanse", difficulty: "Trudny", s1: "Cold Calling startupów tech", s2: "Rozliczenie success-fee (bez ryzyka)", s3: "Spotkania w inkubatorach" },
  { name: "Zdalny Inspektor BHP (Szkolenia e-learning)", industry: "BHP Online", category: "Edukacja", difficulty: "Średni", s1: "Cold SMS do firm produkcyjnych z przypomnieniem o terminach", s2: "Bazy CEIDG", s3: "Telemarketing" },
  { name: "Audyty Bezpieczeństwa Smart Kontraktów (Krypto)", industry: "Smart Contract Security", category: "Technologia", difficulty: "Trudny", s1: "Cold Calling/Telegram do twórców nowych tokenów", s2: "Bug bounty hunting", s3: "GitHub" },
  { name: "Trening Wystąpień Publicznych Online", industry: "Public Speaking", category: "Edukacja", difficulty: "Średni", s1: "Cold Calling prezesów i mówców TEDx", s2: "Analiza wideo ich poprzednich wystąpień w Cold Emailu", s3: "TikTok poradnikowy" },
];

async function main() {
  console.log(`Seeding ${BUSINESSES.length} businesses...`);
  await prisma.strategyCard.deleteMany();
  await prisma.businessStrategy.deleteMany();

  for (const b of BUSINESSES) {
    await prisma.businessStrategy.create({
      data: {
        name: b.name,
        industry: b.industry,
        category: b.category,
        difficulty: b.difficulty,
        description: `Trzy sprawdzone sposoby pozyskiwania klientów dla ${b.name}: ${b.s1}, ${b.s2}, ${b.s3}.`,
        teaser: `Odblokuj i sprawdź jak ${b.name} zdobywa klientów.`,
        strategies: {
          create: [
            { type: "1", title: b.s1, content: "" },
            { type: "2", title: b.s2, content: "" },
            { type: "3", title: b.s3, content: "" },
          ],
        },
      },
    });
  }
  console.log(`✓ Seeded ${BUSINESSES.length} businesses.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

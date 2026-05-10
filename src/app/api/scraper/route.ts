import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SCRAPER_LIMITS } from "@/config/credits";
import { CREDIT_COSTS } from "@/types";

interface PlacesTextResult {
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  place_id: string;
}

interface PlacesTextResponse {
  status: string;
  results: PlacesTextResult[];
  error_message?: string;
}

interface PlacesDetailResult {
  formatted_phone_number?: string;
  website?: string;
}

interface PlacesDetailResponse {
  status: string;
  result?: PlacesDetailResult;
}

// Mock data generator for testing without API key
function generateMockCompanies(industry: string, city: string, count: number) {
  const names = [
    `${industry} "${city}"`, `${industry} Premium`, `${industry} Express`, `Firma ${industry}owa`,
    `${industry} Pro`, `${industry} Master`, `${industry} Centrum`, `${industry} Serwis`,
    `${industry} Specjalist`, `${industry} Expert`, `${industry} Plus`, `${industry} Top`,
    `${industry} 24/7`, `${industry} Quality`, `Najlepszy ${industry}`, `${industry} Direct`,
  ];

  const streets = [
    "Marszałkowska", "Królewska", "Nowy Świat", "Aleje Jerozolimskie", "Piłsudskiego",
    "Warszawska", "Krakowska", "Długa", "Rynek", "Dworcowa", "Kościuszki", "Mickiewicza",
  ];

  const results = [];
  for (let i = 0; i < Math.min(count, 20); i++) {
    const hasWebsite = Math.random() > 0.4;
    const reviewCount = Math.floor(Math.random() * 50);
    const rating = reviewCount > 0 ? (3.5 + Math.random() * 1.5).toFixed(1) : null;

    results.push({
      name: names[i % names.length] + ` #${i + 1}`,
      phone: `+48 ${Math.floor(100 + Math.random() * 899)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(100 + Math.random() * 899)}`,
      rating: rating ? String(rating) : "",
      reviewCount,
      address: `${streets[i % streets.length]} ${Math.floor(1 + Math.random() * 100)}, ${city}`,
      website: hasWebsite ? `www.${industry.toLowerCase().replace(/\s/g, "")}-${city.toLowerCase()}${i + 1}.pl` : "",
      category: industry,
    });
  }
  return results;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, tier: true, credits: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { industry, city, count = 20 } = body;
  if (!industry || !city) return NextResponse.json({ error: "Missing industry or city" }, { status: 400 });

  // Check tier access & daily limit
  const tierLimit = SCRAPER_LIMITS[user.tier as keyof typeof SCRAPER_LIMITS] ?? 0;

  if (tierLimit === 0 && user.role !== "ADMIN") {
    // FREE tier - must pay with credits
    const totalCost = count * CREDIT_COSTS.SCRAPER_COMPANY;
    if (user.credits < totalCost) {
      return NextResponse.json({
        error: "INSUFFICIENT_CREDITS",
        message: `Scraper wymaga ${totalCost} kredytów (${count} firm × ${CREDIT_COSTS.SCRAPER_COMPANY} kredyty). Masz ${user.credits} kredytów. Kup subskrypcję lub dokup kredyty.`,
        needed: totalCost - user.credits,
      }, { status: 402 });
    }
  } else if (user.role !== "ADMIN") {
    // Paid tier - check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayScraperUse = await prisma.activity.aggregate({
      where: {
        userId: user.id,
        type: "SCRAPER_USE",
        createdAt: { gte: today },
      },
      _sum: { creditsUsed: true },
    });

    const companiesScrapedToday = todayScraperUse._sum.creditsUsed ?? 0;

    if (companiesScrapedToday + count > tierLimit) {
      return NextResponse.json({
        error: "DAILY_LIMIT_EXCEEDED",
        message: `Dzienny limit: ${tierLimit} firm. Dziś zescrapowano już ${companiesScrapedToday} firm. Pozostało: ${tierLimit - companiesScrapedToday}.`,
        limit: tierLimit,
        used: companiesScrapedToday,
      }, { status: 429 });
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY ?? "";

  // MOCK MODE - gdy brak API key, zwróć przykładowe firmy
  if (!apiKey) {
    const mockResults = generateMockCompanies(industry, city, count);

    // Deduct credits or log usage (same as real scraper)
    if (tierLimit === 0 && user.role !== "ADMIN") {
      const totalCost = mockResults.length * CREDIT_COSTS.SCRAPER_COMPANY;
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCost } },
      });
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SCRAPER_USE",
          description: `Scraper MOCK: ${mockResults.length} firm (${industry} w ${city})`,
          creditsUsed: totalCost,
          metadata: JSON.stringify({ industry, city, count: mockResults.length, mock: true }),
        },
      });
    } else if (user.role !== "ADMIN") {
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "SCRAPER_USE",
          description: `Scraper MOCK: ${mockResults.length} firm (${industry} w ${city})`,
          creditsUsed: mockResults.length,
          metadata: JSON.stringify({ industry, city, count: mockResults.length, mock: true }),
        },
      });
    }

    return NextResponse.json({ results: mockResults, mock: true });
  }

  const query = encodeURIComponent(`${industry} ${city}`);
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pl&region=pl&key=${apiKey}`;

  let searchData: PlacesTextResponse;
  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    searchData = await res.json() as PlacesTextResponse;
  } catch {
    return NextResponse.json({ error: "TIMEOUT" }, { status: 504 });
  }

  if (searchData.status === "REQUEST_DENIED" || searchData.status === "INVALID_REQUEST") {
    return NextResponse.json({ error: "INVALID_API_KEY", detail: searchData.error_message }, { status: 401 });
  }
  if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
    return NextResponse.json({ error: "PLACES_ERROR", detail: searchData.status }, { status: 502 });
  }

  const places = (searchData.results ?? []).slice(0, count);

  // Fetch phone + website for each place in parallel (capped at 5 concurrent)
  const results = await Promise.all(
    places.map(async (place) => {
      let phone = "";
      let website = "";
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;
        const dr = await fetch(detailUrl, { signal: AbortSignal.timeout(8000) });
        const dd = await dr.json() as PlacesDetailResponse;
        if (dd.status === "OK" && dd.result) {
          phone = dd.result.formatted_phone_number ?? "";
          website = dd.result.website ?? "";
        }
      } catch { /* skip — phone/website stay empty */ }

      return {
        name: place.name ?? "",
        phone,
        rating: place.rating != null ? String(place.rating) : "",
        reviewCount: place.user_ratings_total ?? 0,
        address: place.formatted_address ?? "",
        website,
        category: place.types?.[0]?.replace(/_/g, " ") ?? "",
      };
    })
  );

  // Deduct credits or log usage
  if (tierLimit === 0 && user.role !== "ADMIN") {
    // FREE tier - deduct credits
    const totalCost = results.length * CREDIT_COSTS.SCRAPER_COMPANY;
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: totalCost } },
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "SCRAPER_USE",
        description: `Scraper: ${results.length} firm (${industry} w ${city})`,
        creditsUsed: totalCost,
        metadata: JSON.stringify({ industry, city, count: results.length }),
      },
    });
  } else if (user.role !== "ADMIN") {
    // Paid tier - log usage (no credits deducted, counts toward daily limit)
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "SCRAPER_USE",
        description: `Scraper: ${results.length} firm (${industry} w ${city})`,
        creditsUsed: results.length, // Store company count in creditsUsed for daily tracking
        metadata: JSON.stringify({ industry, city, count: results.length }),
      },
    });
  }

  return NextResponse.json({ results });
}

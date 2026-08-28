import { NextResponse } from "next/server";
import { FALLBACK_ARTICLES, FALLBACK_SOURCES } from "@/lib/mockNews";
import { getLiveGoogleNews, cleanHtmlEntities } from "@/lib/rssNews";
import { generateArticleId } from "@/lib/articleUtils";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const NEWS_API_KEY = process.env.NEWS_API_KEY || "";

const GNEWS_CATEGORIES = {
  general: "general",
  technology: "technology",
  business: "business",
  science: "science",
  sports: "sports",
  entertainment: "entertainment",
  health: "health",
};

// In-Memory API Cache to prevent burning through 100 requests/day quota
const apiCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache per unique query/category

function getCached(key) {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (apiCache.size > 200) {
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }
  apiCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "headlines";
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "us";
  const query = searchParams.get("q") || "";
  const source = searchParams.get("sources") || "";
  const sortBy = searchParams.get("sortBy") || "publishedAt";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

  // Handle sources list request
  if (type === "sources") {
    return handleSourcesRequest(category);
  }

  const isSearch = type === "search" || query.trim().length > 0;
  let allArticles = [];
  let detectedSource = "curated_fallback";

  // 1. Primary Strategy: Try NewsAPI first (high capacity, real-time with authentic photos)
  if (NEWS_API_KEY) {
    try {
      const newsApiResult = await fetchFromNewsAPI({
        isSearch,
        query,
        category,
        country,
        source,
        sortBy,
        page: 1,
        pageSize: isSearch ? 30 : 25,
      });
      if (newsApiResult && newsApiResult.articles && newsApiResult.articles.length > 0) {
        allArticles = newsApiResult.articles;
        detectedSource = "newsapi";
      }
    } catch (e) {
      console.warn("NewsAPI notice:", e.message);
    }
  }

  // 2. Secondary Strategy: Supplement with GNews API (authentic photos)
  if (GNEWS_API_KEY) {
    try {
      const gnewsResult = await fetchFromGNews({ isSearch, query, category, country, limit: 10 });
      if (gnewsResult && gnewsResult.articles && gnewsResult.articles.length > 0) {
        if (allArticles.length === 0) {
          allArticles = gnewsResult.articles;
          detectedSource = "gnews";
        } else {
          allArticles = [...allArticles, ...gnewsResult.articles];
        }
      }
    } catch (e) {
      console.warn("GNews notice:", e.message);
    }
  }

  // 3. Supplemental High-Capacity Google News RSS Wire
  // For search, only query RSS if NewsAPI/GNews found few results to keep real images prominent
  const needRss = !isSearch || allArticles.length < 8;
  if (needRss) {
    try {
      const liveGoogleArticles = await getLiveGoogleNews({
        query,
        category: category || "general",
        country,
        limit: isSearch ? 30 : 60,
      });

      if (liveGoogleArticles && liveGoogleArticles.length > 0) {
        if (allArticles.length === 0) {
          allArticles = liveGoogleArticles;
          detectedSource = "global_wire";
        } else {
          allArticles = [...allArticles, ...liveGoogleArticles];
        }
      }
    } catch (e) {
      console.warn("Live wire notice:", e.message);
    }
  }

  // 4. If this is an active search that has 0 results across all providers, return empty array
  if (allArticles.length === 0 && isSearch && query.trim()) {
    return NextResponse.json({
      status: "ok",
      source: "search_engine",
      totalResults: 0,
      articles: [],
      hasMore: false,
    });
  }

  // 5. Emergency Offline Fallback
  if (allArticles.length === 0) {
    let fallbackPool = [...FALLBACK_ARTICLES];
    if (category && category !== "all") {
      fallbackPool = fallbackPool.filter((a) => a.category === category);
    }
    allArticles = fallbackPool.length > 0 ? fallbackPool : FALLBACK_ARTICLES;
    detectedSource = "curated_fallback";
  }

  // Strict In-Memory Deduplication
  const uniqueArticles = deduplicateArticles(allArticles);

  // In-Memory Publisher Filter
  let filtered = uniqueArticles;
  if (source && source !== "all") {
    filtered = filtered.filter(
      (a) => a.source?.id === source || a.source?.name?.toLowerCase().includes(source.toLowerCase())
    );
  }

  // In-Memory Sorting: prioritize articles with genuine publisher images at the front, sorted by date
  if (sortBy === "publishedAt") {
    filtered.sort((a, b) => {
      // Prioritize articles that have genuine publisher photos over generic stock fallbacks
      const aHasRealImg = a.urlToImage && !a.isStockImage ? 1 : 0;
      const bHasRealImg = b.urlToImage && !b.isStockImage ? 1 : 0;
      if (aHasRealImg !== bHasRealImg) {
        return bHasRealImg - aHasRealImg;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  // Virtual Slicing & Pagination
  const startIndex = (page - 1) * pageSize;
  const paginatedArticles = filtered.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < filtered.length;

  return NextResponse.json({
    status: "ok",
    source: detectedSource,
    totalResults: filtered.length,
    page,
    pageSize,
    hasMore,
    articles: paginatedArticles,
  });
}

function deduplicateArticles(articles) {
  const seen = new Set();
  const result = [];

  for (const a of articles) {
    if (!a.title || a.title.includes("[Removed]")) continue;
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 35);
    if (!seen.has(key) && (!a.url || !seen.has(a.url))) {
      seen.add(key);
      if (a.url) seen.add(a.url);
      
      // Ensure article ID exists
      if (!a.id) {
        a.id = generateArticleId(a);
      }
      result.push(a);
    }
  }

  return result;
}

// ─── GNews API Provider ──────────────────────────────────────────────
async function fetchFromGNews({ isSearch, query, category, country, limit }) {
  if (!GNEWS_API_KEY) return null;

  const cacheKey = `gnews:${isSearch}:${query}:${category}:${country}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const maxResults = 10;
  let url = "";

  if (isSearch && query.trim()) {
    const params = new URLSearchParams({
      q: query.trim(),
      lang: "en",
      max: maxResults.toString(),
      apikey: GNEWS_API_KEY,
    });
    url = `https://gnews.io/api/v4/search?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      lang: "en",
      country: country || "us",
      max: maxResults.toString(),
      apikey: GNEWS_API_KEY,
    });
    if (category && category !== "all" && GNEWS_CATEGORIES[category]) {
      params.set("category", GNEWS_CATEGORIES[category]);
    }
    url = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NexaNewsAggregator/2.0" },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.articles || data.articles.length === 0) return null;

    const articles = data.articles
      .filter((a) => a.title && a.title !== "[Removed]")
      .map((a) => {
        const cleanT = cleanText(a.title);
        const cleanD = cleanText(a.description);
        const wordCount = (cleanT + " " + cleanD).split(/\s+/).length;
        const articleItem = {
          source: { id: slugify(a.source?.name || "news"), name: a.source?.name || "News Wire" },
          author: a.author || a.source?.name || null,
          title: cleanT,
          description: cleanD,
          url: a.url,
          urlToImage: a.image || null,
          isStockImage: !a.image,
          publishedAt: a.publishedAt,
          content: cleanText(a.content) || cleanD,
          category: category || "general",
          sentiment: "neutral",
          sentimentLabel: "Standard Wire",
          tag: "Live Wire",
          readTime: `${Math.max(1, Math.ceil((wordCount + 180) / 180))}m read`,
        };
        articleItem.id = generateArticleId(articleItem);
        return articleItem;
      });

    const result = { totalResults: data.totalArticles || articles.length, articles };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    return null;
  }
}

// ─── NewsAPI Provider ────────────────────────────────────────────────
async function fetchFromNewsAPI({ isSearch, query, category, country, source, sortBy, page, pageSize }) {
  if (!NEWS_API_KEY) return null;

  const cacheKey = `newsapi:${isSearch}:${query}:${category}:${country}:${source}:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const BASE_URL = "https://newsapi.org/v2";
  let targetUrl;

  if (isSearch && query.trim()) {
    const params = new URLSearchParams({
      q: query.trim(),
      language: "en",
      sortBy: "publishedAt",
      page: page.toString(),
      pageSize: pageSize.toString(),
      apiKey: NEWS_API_KEY,
    });
    if (source && source !== "all") params.set("sources", source);
    targetUrl = `${BASE_URL}/everything?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      language: "en",
      apiKey: NEWS_API_KEY,
    });
    if (source && source !== "all") {
      params.set("sources", source);
    } else {
      if (country) params.set("country", country);
      if (category && category !== "all") params.set("category", category);
    }
    targetUrl = `${BASE_URL}/top-headlines?${params.toString()}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "NexaNewsAggregator/2.0" },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === "error" || !data.articles?.length) return null;

    const articles = data.articles
      .filter((a) => a.title && !a.title.includes("[Removed]"))
      .map((a) => {
        const cleanT = cleanText(a.title);
        const cleanD = cleanText(a.description);
        const wordCount = (cleanT + " " + cleanD).split(/\s+/).length;
        const articleItem = {
          ...a,
          title: cleanT,
          description: cleanD,
          content: cleanText(a.content) || cleanD,
          category: category || "general",
          isStockImage: !a.urlToImage,
          sentiment: "neutral",
          sentimentLabel: "Standard Wire",
          tag: "NewsAPI",
          readTime: `${Math.max(1, Math.ceil((wordCount + 180) / 180))}m read`,
        };
        articleItem.id = generateArticleId(articleItem);
        return articleItem;
      });

    const result = { totalResults: data.totalResults || articles.length, articles };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    return null;
  }
}

// ─── Sources Handler ─────────────────────────────────────────────────
async function handleSourcesRequest(category) {
  return NextResponse.json({
    status: "ok",
    source: "curated",
    sources: FALLBACK_SOURCES,
  });
}

function cleanText(str) {
  if (!str) return "";
  let s = str
    .replace(/<[^>]+>/g, "")
    .replace(/\?\?/g, "")
    .replace(/\[\+\d+ chars\]/, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleanHtmlEntities(s);
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
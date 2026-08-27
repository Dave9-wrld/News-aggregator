import { XMLParser } from "fast-xml-parser";
import { getDynamicArticleImage, inferCategoryFromText } from "./imageUtils.js";
import { generateArticleId, calculateReadTime } from "./articleUtils.js";

const CATEGORY_TOPICS = {
  general: "WORLD",
  technology: "TECHNOLOGY",
  business: "BUSINESS",
  science: "SCIENCE",
  sports: "SPORTS",
  entertainment: "ENTERTAINMENT",
  health: "HEALTH",
};

const COUNTRY_CONFIGS = {
  us: { hl: "en-US", gl: "US", ceid: "US:en" },
  gb: { hl: "en-GB", gl: "GB", ceid: "GB:en" },
  ca: { hl: "en-CA", gl: "CA", ceid: "CA:en" },
  au: { hl: "en-AU", gl: "AU", ceid: "AU:en" },
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "__cdata",
  trimValues: true,
  parseTagValue: false,
});

function analyzeSentimentAndTags(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  
  if (text.match(/\b(breakthrough|surge|record|rally|soars|gains|jump|boom|success|victory|win|signed|joins|advances)\b/)) {
    return { sentiment: "positive", sentimentLabel: "Bullish / Positive", tag: "Breakthrough" };
  }
  if (text.match(/\b(crisis|collapse|plunges|drop|fall|warns|threat|war|danger|crash|probe|investigation|racism|racist|attack|injury|injured|deficit|loss)\b/)) {
    return { sentiment: "critical", sentimentLabel: "Critical / Alert", tag: "Alert" };
  }
  if (text.match(/\b(policy|report|study|plan|proposes|unveils|announces|analysis|signals|targets|number|jersey|squad|framework|review)\b/)) {
    return { sentiment: "analysis", sentimentLabel: "Analysis & Policy", tag: "Analysis" };
  }
  return { sentiment: "neutral", sentimentLabel: "Standard Dispatch", tag: "Wire" };
}

/**
 * Fetch and parse Google News Live RSS feed with robust XML parser
 */
export async function getLiveGoogleNews({ query, category = "general", country = "us", limit = 80 }) {
  const geo = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.us;
  let url = "";

  if (query && query.trim()) {
    const encoded = encodeURIComponent(query.trim());
    url = `https://news.google.com/rss/search?q=${encoded}&hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
  } else if (category && category !== "all" && CATEGORY_TOPICS[category]) {
    url = `https://news.google.com/rss/headlines/section/topic/${CATEGORY_TOPICS[category]}?hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
  } else {
    url = `https://news.google.com/rss?hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    return parseGoogleNewsXml(xml, query, category, limit);
  } catch (err) {
    console.warn("Google News RSS Error:", err.message);
    return [];
  }
}

/**
 * Parse Google News XML items using fast-xml-parser with strict deduplication
 */
function parseGoogleNewsXml(xml, query, category, limit) {
  if (!xml || typeof xml !== "string") return [];

  let parsed;
  try {
    parsed = xmlParser.parse(xml);
  } catch (e) {
    console.warn("fast-xml-parser error:", e.message);
    return [];
  }

  const channel = parsed?.rss?.channel;
  if (!channel) return [];

  const rawItems = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : [];

  const articles = [];
  const seenTitles = new Set();

  for (let i = 0; i < rawItems.length; i++) {
    if (articles.length >= limit) break;

    try {
      const item = rawItems[i];
      if (!item) continue;

      const rawTitle = extractString(item.title);
      if (!rawTitle || rawTitle.includes("[Removed]")) continue;

      let link = extractString(item.link) || extractString(item.guid) || "";
      if (!link && item["@_href"]) link = item["@_href"];
      if (!link) continue;

      let cleanTitle = rawTitle;
      let sourceName = extractString(item.source) || "Global Wire";

      const dashIdx = rawTitle.lastIndexOf(" - ");
      if (dashIdx > 0) {
        cleanTitle = rawTitle.substring(0, dashIdx).trim();
        sourceName = rawTitle.substring(dashIdx + 3).trim();
      }

      const normalizedTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
      if (seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);

      const rawDescription = extractString(item.description) || "";
      const cleanDesc = cleanHtmlContent(rawDescription, cleanTitle, sourceName);

      const pubDateStr = extractString(item.pubDate);
      const publishedAt = pubDateStr && !isNaN(new Date(pubDateStr).getTime())
        ? new Date(pubDateStr).toISOString()
        : new Date().toISOString();

      const sourceId = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const resolvedCategory = inferCategoryFromText(cleanTitle, query, category);

      // Extract real image from media/enclosure tags if present
      const mediaUrl = extractMediaUrl(item);
      const imageUrl = mediaUrl || getDynamicArticleImage(cleanTitle, resolvedCategory, articles.length);
      const isStockImage = !mediaUrl;

      const { sentiment, sentimentLabel, tag } = analyzeSentimentAndTags(cleanTitle, cleanDesc);
      const readTime = calculateReadTime(`${cleanTitle} ${cleanDesc}`);

      const articlePayload = {
        source: { id: sourceId, name: sourceName },
        author: sourceName,
        title: cleanHtmlEntities(cleanTitle),
        description: cleanDesc,
        url: link,
        urlToImage: imageUrl,
        isStockImage,
        publishedAt,
        content: cleanDesc,
        category: resolvedCategory,
        sentiment,
        sentimentLabel,
        tag,
        readTime,
      };

      articlePayload.id = generateArticleId(articlePayload);
      articles.push(articlePayload);
    } catch (e) {
      continue;
    }
  }

  return articles;
}

function extractString(val) {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") {
    if (val.__cdata) return String(val.__cdata).trim();
    if (val["#text"]) return String(val["#text"]).trim();
  }
  return String(val).trim();
}

function extractMediaUrl(item) {
  if (!item) return null;

  // 1. media:content
  if (item["media:content"]?.["@_url"]) return item["media:content"]["@_url"];
  if (Array.isArray(item["media:content"]) && item["media:content"][0]?.["@_url"]) {
    return item["media:content"][0]["@_url"];
  }

  // 2. enclosure
  if (item.enclosure?.["@_url"]) {
    const type = item.enclosure["@_type"] || "";
    if (!type || type.startsWith("image/")) return item.enclosure["@_url"];
  }

  // 3. media:thumbnail
  if (item["media:thumbnail"]?.["@_url"]) return item["media:thumbnail"]["@_url"];
  if (Array.isArray(item["media:thumbnail"]) && item["media:thumbnail"][0]?.["@_url"]) {
    return item["media:thumbnail"][0]["@_url"];
  }

  return null;
}

/**
 * Clean all HTML tags, URLs, and tracking parameters
 */
function cleanHtmlContent(rawHtml, title, sourceName) {
  if (!rawHtml) {
    return `Verified live intelligence report syndicated from ${sourceName}. Access complete coverage on official publisher wire.`;
  }

  let str = rawHtml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/[^\s]+/g, " ")
    .replace(/\b[0-9]{15,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  str = cleanHtmlEntities(str);

  if (!str || str.length < 20 || str.toLowerCase() === title.toLowerCase()) {
    return `Comprehensive live reporting and context published by ${sourceName}. Click to open complete dispatch.`;
  }

  return str;
}

export function cleanHtmlEntities(str) {
  if (!str) return "";

  const entityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&#39;": "'",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&laquo;": "«",
    "&raquo;": "»",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&bull;": "•",
    "&middot;": "·",
    "&pound;": "£",
    "&euro;": "€",
    "&yen;": "¥",
    "&cent;": "¢",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&deg;": "°",
    "&plusmn;": "±",
    "&times;": "×",
    "&divide;": "÷",
    "&nbsp;": " ",
    "&#8211;": "–",
    "&#8212;": "—",
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8230;": "…",
  };

  let cleaned = str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });

  for (const [entity, replacement] of Object.entries(entityMap)) {
    cleaned = cleaned.replaceAll(entity, replacement);
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

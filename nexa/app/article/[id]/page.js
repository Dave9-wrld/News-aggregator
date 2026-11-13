import { FALLBACK_ARTICLES } from "@/lib/mockNews";
import { getLiveGoogleNews } from "@/lib/rssNews";
import { generateArticleId, decodeArticleId } from "@/lib/articleUtils";
import ArticleReaderView from "@/components/ArticleReaderView";

const BACKEND_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

async function fetchBackend(path) {
  try {
    const response = await fetch(`${BACKEND_URL}/${path}`, { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// Helper to look up or reconstruct article by ID
async function findArticleById(id) {
  if (!id) return null;

  if (id.startsWith("original-")) {
    const article = await fetchBackend(`articles/${id.replace("original-", "")}/`);
    if (article) {
      const uploadedCover = article.cover_image_file
        ? new URL(article.cover_image_file, BACKEND_URL).toString()
        : "";
      return {
        id,
        kind: "original",
        article_id: article.id,
        title: article.title,
        description: article.body.slice(0, 500),
        content: article.body,
        url: `/article/${id}`,
        urlToImage: uploadedCover || article.cover_image,
        source: { id: "the-global-chronicle", name: "The Global Chronicle" },
        author: article.author?.username,
        publishedAt: article.published_at || article.created_at,
        category: article.category,
      };
    }
  }

  if (id.startsWith("ext_")) {
    const article = await fetchBackend(`external-articles/${id}/`);
    if (article) return article;
  }

  // 1. Direct Base64url payload decoding
  const decodedArticle = decodeArticleId(id);
  if (decodedArticle) {
    return decodedArticle;
  }

  // 2. Search fallback mock articles
  const fallbackMatch = FALLBACK_ARTICLES.find(
    (a) => a.id === id || generateArticleId(a) === id
  );
  if (fallbackMatch) return fallbackMatch;

  // 3. Search live wire RSS articles
  try {
    const liveArticles = await getLiveGoogleNews({ limit: 100 });
    const liveMatch = liveArticles.find(
      (a) => a.id === id || generateArticleId(a) === id
    );
    if (liveMatch) return liveMatch;
  } catch (err) {
    console.warn("Live article lookup notice:", err.message);
  }

  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await findArticleById(id);

  if (!article) {
    return {
      title: "Article Not Found | The Global Chronicle",
      description: "The requested article could not be located.",
    };
  }

  return {
    title: `${article.title} | The Global Chronicle`,
    description: article.description || "Live international news reporting.",
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      images: article.urlToImage ? [{ url: article.urlToImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: article.urlToImage ? [article.urlToImage] : [],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const article = await findArticleById(id);

  return (
    <main className="min-h-screen bg-[#f8faf9] text-[#112117]">
      <ArticleReaderView article={article} />
    </main>
  );
}

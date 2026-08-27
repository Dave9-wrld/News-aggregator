import { FALLBACK_ARTICLES } from "@/lib/mockNews";
import { getLiveGoogleNews } from "@/lib/rssNews";
import { generateArticleId, decodeArticleId } from "@/lib/articleUtils";
import ArticleReaderView from "@/components/ArticleReaderView";

// Helper to look up or reconstruct article by ID
async function findArticleById(id) {
  if (!id) return null;

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
    <main className="min-h-screen bg-[#0a0c10] text-[#f8fafc]">
      <ArticleReaderView article={article} />
    </main>
  );
}

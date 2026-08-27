"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import CategoryBar from "@/components/CategoryBar";
import HeroFeatured from "@/components/HeroFeatured";
import NewsCard from "@/components/NewsCard";
import ArticleModal from "@/components/ArticleModal";
import BookmarksDrawer from "@/components/BookmarksDrawer";
import BriefingDrawer from "@/components/BriefingDrawer";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Footer from "@/components/Footer";
import { Search, AlertCircle, ChevronRight, Check, AlertTriangle } from "lucide-react";

const PROVIDER_LABELS = {
  gnews: "GNews Intelligence",
  global_wire: "Global Wire Network",
  currents: "Currents Wire",
  newsapi: "NewsAPI",
  curated_fallback: "Sample Dispatches",
};

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [breakingHeadline, setBreakingHeadline] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [country, setCountry] = useState("us");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data source tracking
  const [dataSource, setDataSource] = useState("");
  const [isFallbackData, setIsFallbackData] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Modal, Bookmarks & Briefing
  const [activeArticle, setActiveArticle] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const debounceTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Safe load bookmarks on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dispatch_news_bookmarks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read bookmarks:", e);
    }
  }, []);

  const saveBookmarks = (newBookmarks) => {
    const capped = newBookmarks.slice(0, 100);
    setBookmarks(capped);
    try {
      localStorage.setItem("dispatch_news_bookmarks", JSON.stringify(capped));
    } catch (e) {
      console.warn("Could not save bookmarks:", e);
    }
  };

  const handleToggleBookmark = (article) => {
    if (!article) return;
    const exists = bookmarks.some((b) => b.title === article.title || (b.url && b.url === article.url));
    let updated;
    if (exists) {
      updated = bookmarks.filter((b) => b.title !== article.title && b.url !== article.url);
      showToast("Removed from saved list");
    } else {
      updated = [article, ...bookmarks];
      showToast("Saved to reading list");
    }
    saveBookmarks(updated);
  };

  const handleClearAllBookmarks = () => {
    saveBookmarks([]);
    showToast("Cleared reading list");
  };

  const handleShare = (article) => {
    const shareUrl = article.id
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/article/${article.id}`
      : article.url;

    if (typeof navigator !== "undefined" && navigator.share && shareUrl) {
      navigator
        .share({
          title: article.title,
          text: article.description,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Article permalink copied to clipboard");
    }
  };

  // Fetch Sources List
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const params = new URLSearchParams();
        params.append("type", "sources");
        if (selectedCategory && selectedCategory !== "all") {
          params.append("category", selectedCategory);
        }
        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.sources) {
          setSources(data.sources.slice(0, 30));
        }
      } catch (err) {
        console.warn("Sources notice:", err);
      }
    };
    fetchSources();
  }, [selectedCategory]);

  // Main Articles Fetch
  const fetchArticles = useCallback(
    async (pageNum = 1, isAppend = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("pageSize", "15");
        params.append("sortBy", sortBy);

        if (activeQuery) {
          params.append("type", "search");
          params.append("q", activeQuery);
          if (selectedSource && selectedSource !== "all") {
            params.append("sources", selectedSource);
          }
        } else {
          params.append("type", "headlines");
          if (selectedSource && selectedSource !== "all") {
            params.append("sources", selectedSource);
          } else {
            params.append("country", country);
            if (selectedCategory && selectedCategory !== "all") {
              params.append("category", selectedCategory);
            }
          }
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!isAppend) {
          setDataSource(data.source || "");
          setIsFallbackData(data.source === "curated_fallback");
        }

        if (data.articles && data.articles.length > 0) {
          const validArticles = data.articles.filter((a) => a.title && a.title !== "[Removed]");

          if (isAppend) {
            setArticles((prev) => {
              const existingKeys = new Set(prev.map((p) => p.id || p.url || p.title));
              const newUnique = validArticles.filter((a) => !existingKeys.has(a.id || a.url || a.title));
              return [...prev, ...newUnique];
            });
          } else {
            setArticles(validArticles);
            if (pageNum === 1 && validArticles.length > 0) {
              setBreakingHeadline(validArticles[0]);
            }
          }
          setHasMore(data.hasMore ?? validArticles.length >= 12);
        } else {
          if (!isAppend) setArticles([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to retrieve dispatches. Please verify your connection.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeQuery, selectedCategory, selectedSource, country, sortBy]
  );

  // Debounced search handling
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        setActiveQuery(searchTerm.trim());
        setSelectedCategory("all");
        setSelectedSource("all");
        setPage(1);
      }, 500);
    } else if (searchTerm.trim().length === 0 && activeQuery) {
      setActiveQuery("");
      setPage(1);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (searchTerm.trim()) {
      setActiveQuery(searchTerm.trim());
      setSelectedCategory("all");
      setSelectedSource("all");
      setPage(1);
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchTerm("");
    setActiveQuery("");
    setPage(1);
  };

  const handleSelectCategory = (catId) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSelectedCategory(catId);
    setSelectedSource("all");
    setActiveQuery("");
    setSearchTerm("");
    setPage(1);
  };

  const handleSelectSource = (srcId) => {
    setSelectedSource(srcId);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage, true);
  };

  useEffect(() => {
    setPage(1);
    fetchArticles(1, false);
  }, [fetchArticles]);

  const leadArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-[#f8fafc] relative overflow-x-hidden">
      
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.07),transparent_70%)] pointer-events-none -z-10" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0f1524]/95 backdrop-blur-md text-white border border-[#2b3a55] shadow-[0_10px_35px_rgba(0,0,0,0.7)] text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <div className="w-5 h-5 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        bookmarksCount={bookmarks.length}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
      />

      {/* Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Fallback Warning Notice */}
        {isFallbackData && !isLoading && (
          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl bg-[#23170d]/80 backdrop-blur-sm border border-[#d97706]/40 text-[#fde68a] text-xs">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Live News Feed Standby / Curated Dispatches Active</p>
              <p className="mt-1 text-[#fcd34d]/90 leading-relaxed font-sans">
                Currently showing verified sample dispatches. Live wire feeds will automatically reconnect on the next cycle.
              </p>
            </div>
          </div>
        )}



        {/* Loading Skeleton */}
        {isLoading && articles.length === 0 ? (
          <LoadingSkeleton />
        ) : error && articles.length === 0 ? (
          <div className="text-center py-20 px-4 max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-[#ef4444] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Service Unreachable</h3>
            <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed font-sans">{error}</p>
            <button
              onClick={() => fetchArticles(1, false)}
              className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 px-4 max-w-md mx-auto">
            <Search className="w-10 h-10 text-[#64748b] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Matching Articles Found</h3>
            <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed font-sans">
              No dispatches found for your query. Try broadening your search keywords.
            </p>
            <button
              onClick={() => {
                setActiveQuery("");
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSource("all");
              }}
              className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Return to Top Stories
            </button>
          </div>
        ) : (
          <div>
            {/* Lead Story */}
            {leadArticle && page === 1 && !activeQuery && (
              <HeroFeatured
                article={leadArticle}
                onOpenArticle={setActiveArticle}
                isBookmarked={bookmarks.some(
                  (b) => b.title === leadArticle.title || (b.url && b.url === leadArticle.url)
                )}
                onToggleBookmark={handleToggleBookmark}
                onShare={handleShare}
              />
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between pb-3.5 mb-7 border-b border-[#182030]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                <h2 className="text-base sm:text-lg font-bold font-editorial text-white uppercase tracking-wider">
                  {activeQuery
                    ? `Search Results: "${activeQuery}"`
                    : selectedCategory !== "all"
                    ? `${selectedCategory} Stories`
                    : "Top Stories & Headlines"}
                </h2>
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {(activeQuery || page > 1 ? articles : gridArticles).map((article, idx) => (
                <NewsCard
                  key={article.id || article.url || article.title || idx}
                  article={article}
                  itemIndex={idx}
                  onOpenArticle={setActiveArticle}
                  isBookmarked={bookmarks.some(
                    (b) => b.title === article.title || (b.url && b.url === article.url)
                  )}
                  onToggleBookmark={handleToggleBookmark}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && !isLoading && (
              <div className="mt-14 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#101624] to-[#0c101a] hover:from-[#172032] hover:to-[#101622] text-[#cbd5e1] hover:text-white border border-[#202c42] hover:border-[#38bdf8]/50 text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_30px_rgba(56,189,248,0.18)] cursor-pointer hover:scale-[1.02]"
                >
                  <span>Load More Stories</span>
                  <ChevronRight className="w-4 h-4 text-[#38bdf8]" />
                </button>
              </div>
            )}

            {isLoading && articles.length > 0 && (
              <div className="mt-10 flex justify-center">
                <div className="h-7 w-7 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        )}

      </main>

      {/* Detail Modal */}
      <ArticleModal
        article={activeArticle}
        isOpen={Boolean(activeArticle)}
        onClose={() => setActiveArticle(null)}
        isBookmarked={bookmarks.some(
          (b) => b.title === activeArticle?.title || (b.url && b.url === activeArticle?.url)
        )}
        onToggleBookmark={handleToggleBookmark}
        onShare={handleShare}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleToggleBookmark}
        onClearAll={handleClearAllBookmarks}
        onOpenArticle={setActiveArticle}
      />

      {/* Executive Briefing Drawer */}
      <BriefingDrawer
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        articles={articles}
        onOpenArticle={setActiveArticle}
      />

      <Footer />

    </div>
  );
}
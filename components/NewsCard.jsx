"use client";

import { Bookmark, Share2, Clock, Volume2, VolumeX, Sparkles } from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";

export default function NewsCard({
  article,
  itemIndex = 0,
  onOpenArticle,
  isBookmarked,
  onToggleBookmark,
  onShare,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();

  if (!article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category, itemIndex);
  const imageSrc = article.urlToImage || dynamicFallback;

  const articleKey = article.url || article.title || article.id;
  const isCurrentlySpeaking = speakingId === articleKey && isPlaying;

  const handleAudioListen = (e) => {
    e.stopPropagation();
    const textToSpeak = `${article.title}. Reported by ${article.source?.name || "Global Wire"}. ${
      article.description || ""
    }`;
    toggleNarration(articleKey, textToSpeak);
  };

  const getSentimentBadge = () => {
    if (article.sentiment === "positive") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 backdrop-blur-sm border border-emerald-800/80 text-emerald-400 text-[9px] font-bold uppercase tracking-wider shadow">
          {article.tag || "Breakthrough"}
        </span>
      );
    }
    if (article.sentiment === "critical") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-950/90 backdrop-blur-sm border border-rose-800/80 text-rose-400 text-[9px] font-bold uppercase tracking-wider shadow">
          {article.tag || "Alert"}
        </span>
      );
    }
    if (article.sentiment === "analysis") {
      return (
        <span className="px-2 py-0.5 rounded-md bg-sky-950/90 backdrop-blur-sm border border-sky-800/80 text-sky-400 text-[9px] font-bold uppercase tracking-wider shadow">
          {article.tag || "Analysis"}
        </span>
      );
    }
    return null;
  };

  return (
    <article className="flex flex-col justify-between rounded-xl bg-gradient-to-b from-[#0f1422] to-[#0a0d15] border border-[#1b2336] hover:border-[#38bdf8]/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_15px_rgba(56,189,248,0.06)] hover:-translate-y-1 transition-all duration-300 p-4 group">
      
      {/* Top Image */}
      <div 
        onClick={() => onOpenArticle(article)}
        className="relative h-48 w-full rounded-lg overflow-hidden bg-[#07090e] mb-3.5 cursor-pointer border border-[#182030]"
      >
        <img
          src={imageSrc}
          alt={article.title || "News article image"}
          onError={(e) => { 
            e.currentTarget.onerror = null;
            e.currentTarget.src = dynamicFallback; 
          }}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d15]/80 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-[#090d16]/90 backdrop-blur-md border border-[#232f44] text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider shadow">
            {article.source?.name || "News"}
          </span>
          {getSentimentBadge()}
        </div>

        {article.readTime && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] text-[#cbd5e1] font-mono border border-white/10">
              {article.readTime}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#64748b] mb-2 font-mono">
            <span className="flex items-center gap-1 text-[#94a3b8]">
              <Clock className="w-3 h-3 text-[#38bdf8]" />
              {formatPublishedDate(article.publishedAt).split(",")[0] || "Recent"}
            </span>
            {article.author && (
              <>
                <span className="text-[#334155]">•</span>
                <span className="truncate max-w-[130px] text-[#64748b]">{article.author}</span>
              </>
            )}
          </div>

          <h3 className="mb-2">
            <button
              type="button"
              onClick={() => onOpenArticle(article)}
              className="text-left text-base font-editorial font-bold text-white group-hover:text-[#93c5fd] transition-colors cursor-pointer line-clamp-2 leading-[1.3] focus:outline-none focus:ring-1 focus:ring-[#38bdf8] rounded"
            >
              {article.title}
            </button>
          </h3>

          <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mb-4 font-sans">
            {article.description || "Click to open full overview and verified reporting on this news article."}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#182030] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenArticle(article)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#38bdf8] hover:text-white uppercase tracking-wider transition-colors cursor-pointer focus:outline-none group/brief"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] group-hover/brief:rotate-12 transition-transform" />
            <span>Smart Brief →</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleAudioListen}
              aria-label={isCurrentlySpeaking ? "Stop audio narration" : "Listen to article audio narration"}
              className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer ${
                isCurrentlySpeaking
                  ? "text-red-400 bg-red-950/80 animate-pulse border border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  : "text-[#64748b] hover:text-white hover:bg-[#151c2c]"
              }`}
              title={isCurrentlySpeaking ? "Stop Voice" : "Listen (Text-to-Speech)"}
            >
              {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onShare(article)}
              aria-label="Share article"
              className="p-1.5 text-[#64748b] hover:text-white hover:bg-[#151c2c] rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
              title="Share Dispatch"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleBookmark(article)}
              aria-label={isBookmarked ? "Remove from bookmarks" : "Save article bookmark"}
              className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer ${
                isBookmarked ? "text-[#38bdf8] bg-[#162032] border border-[#2b3d5e]" : "text-[#64748b] hover:text-white hover:bg-[#151c2c]"
              }`}
              title={isBookmarked ? "Remove Saved" : "Save for Later"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-[#38bdf8]" : ""}`} />
            </button>
          </div>
        </div>

      </div>

    </article>
  );
}
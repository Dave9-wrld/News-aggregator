"use client";

import { Bookmark, Share2, Clock, ChevronRight, Volume2, VolumeX, Sparkles, Flame } from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";

export default function HeroFeatured({
  article,
  onOpenArticle,
  isBookmarked,
  onToggleBookmark,
  onShare,
}) {
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();

  if (!article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category);
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

  return (
    <section className="w-full mb-12">
      <div className="rounded-2xl bg-gradient-to-b from-[#0f1524] via-[#0b0f19] to-[#080b12] border border-[#1f293d] hover:border-[#2a3854] transition-all duration-300 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-stretch">
          
          {/* Left 7 Cols: Cinematic Cover Image */}
          <div 
            onClick={() => onOpenArticle(article)}
            className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[340px] rounded-xl overflow-hidden bg-[#07090e] border border-[#1c2436] group cursor-pointer"
          >
            <img
              src={imageSrc}
              alt={article.title || "Lead story image"}
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = dynamicFallback; 
              }}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b12]/90 via-[#080b12]/20 to-transparent pointer-events-none" />

            <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-lg border border-red-500/30">
                <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                Lead Story
              </span>
              <span className="px-2.5 py-1 bg-[#090d15]/90 backdrop-blur-md text-[#38bdf8] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#26324a] shadow">
                {article.source?.name || "Global News"}
              </span>
            </div>

            {article.readTime && (
              <div className="absolute bottom-3.5 right-3.5">
                <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm text-[#cbd5e1] text-[11px] font-mono border border-white/10">
                  {article.readTime}
                </span>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Editorial Column */}
          <div className="lg:col-span-5 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8492a6] mb-3 font-mono">
                <span className="font-semibold text-[#38bdf8] uppercase tracking-wide text-[11px]">
                  {article.source?.name || "Dispatch"}
                </span>
                <span className="text-[#334155]">•</span>
                <span className="flex items-center gap-1.5 text-[#94a3b8]">
                  <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                  {formatPublishedDate(article.publishedAt)}
                </span>
              </div>

              <h2 className="mb-4">
                <button
                  type="button"
                  onClick={() => onOpenArticle(article)}
                  className="text-left text-2xl sm:text-3xl lg:text-[28px] font-editorial font-bold text-white hover:text-[#93c5fd] transition-colors cursor-pointer leading-[1.25] tracking-tight focus:outline-none focus:ring-1 focus:ring-[#38bdf8] rounded"
                >
                  {article.title}
                </button>
              </h2>

              <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed line-clamp-4 mb-6 font-sans">
                {article.description || "Read comprehensive reporting, official verified statements, and strategic context on this developing dispatch."}
              </p>
            </div>

            <div className="pt-4 border-t border-[#1a2335] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onOpenArticle(article)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#3b82f6] hover:to-[#2563eb] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                <span>Read Smart Intelligence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAudioListen}
                  aria-label={isCurrentlySpeaking ? "Stop audio narration" : "Listen to lead story"}
                  className={`p-2.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer ${
                    isCurrentlySpeaking
                      ? "text-red-400 bg-red-950/80 animate-pulse border border-red-800 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                      : "text-[#94a3b8] hover:text-white bg-[#101624] hover:bg-[#182032] border border-[#1e273a]"
                  }`}
                  title={isCurrentlySpeaking ? "Stop Voice" : "Listen (Text-to-Speech)"}
                >
                  {isCurrentlySpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#38bdf8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => onShare(article)}
                  aria-label="Share article link"
                  className="p-2.5 text-[#94a3b8] hover:text-white bg-[#101624] hover:bg-[#182032] border border-[#1e273a] rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
                  title="Share Article"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(article)}
                  aria-label={isBookmarked ? "Remove lead story from saved list" : "Save lead story for later"}
                  className={`p-2.5 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer ${
                    isBookmarked
                      ? "text-[#38bdf8] bg-[#162032] border border-[#2c3d5e] shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                      : "text-[#94a3b8] hover:text-white bg-[#101624] hover:bg-[#182032] border border-[#1e273a]"
                  }`}
                  title={isBookmarked ? "Remove Saved" : "Save for Later"}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#38bdf8]" : ""}`} />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
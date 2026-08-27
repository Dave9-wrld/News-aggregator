"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  User,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  ShieldCheck,
  Languages,
  RefreshCw,
  Share,
} from "lucide-react";
import { getDynamicArticleImage } from "@/lib/imageUtils";
import { useAudioPlayer } from "@/lib/AudioContext";
import { formatPublishedDate } from "@/lib/articleUtils";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "it", label: "Italian (Italiano)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "zh-CN", label: "Chinese (中文)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ar", label: "Arabic (العربية)" },
];

export default function ArticleReaderView({ article }) {
  const { speakingId, isPlaying, toggleNarration, stopNarration } = useAudioPlayer();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState("text-base");
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Translation State
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isTranslatedView, setIsTranslatedView] = useState(false);

  const articleKey = article?.url || article?.title || article?.id;
  const isCurrentlySpeaking = speakingId === articleKey && isPlaying;

  // Load bookmark status
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dispatch_news_bookmarks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setIsBookmarked(parsed.some((b) => b.title === article?.title || (b.url && b.url === article?.url)));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [article]);

  // Load AI Executive Summary
  useEffect(() => {
    if (!article) return;

    let isMounted = true;
    async function loadSummary() {
      setIsLoadingSummary(true);
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: article.title,
            description: article.description,
            content: article.content,
            source: article.source,
            category: article.category,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.summary) {
          setSummaryData(data.summary);
        }
      } catch (err) {
        console.warn("Summary error:", err);
      } finally {
        if (isMounted) setIsLoadingSummary(false);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [article]);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Article Not Found</h2>
        <p className="text-xs text-[#94a3b8] mb-6">The requested news dispatch could not be located.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#2563eb] text-white text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Top Stories</span>
        </Link>
      </div>
    );
  }

  const dynamicFallback = getDynamicArticleImage(article.title, article.category);
  const imageSrc = article.urlToImage || dynamicFallback;
  const formattedDate = formatPublishedDate(article.publishedAt);

  const handleToggleBookmark = () => {
    try {
      const saved = localStorage.getItem("dispatch_news_bookmarks");
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      const exists = list.some((b) => b.title === article.title || (b.url && b.url === article.url));
      let updated;
      if (exists) {
        updated = list.filter((b) => b.title !== article.title && b.url !== article.url);
        setIsBookmarked(false);
      } else {
        updated = [article, ...list].slice(0, 100);
        setIsBookmarked(true);
      }
      localStorage.setItem("dispatch_news_bookmarks", JSON.stringify(updated));
    } catch (e) {
      console.warn("Bookmark error:", e);
    }
  };

  const handleShare = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : article.url;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.description,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTranslate = async (langCode) => {
    const langToUse = langCode || targetLang;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content,
          targetLang: langToUse,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setTranslatedContent(data);
        setIsTranslatedView(true);
      }
    } catch (err) {
      console.warn("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const currentTitle = isTranslatedView && translatedContent?.translatedTitle
    ? translatedContent.translatedTitle
    : article.title;

  const currentDesc = isTranslatedView && translatedContent?.translatedDescription
    ? translatedContent.translatedDescription
    : article.description;

  const currentContent = isTranslatedView && translatedContent?.translatedContent
    ? translatedContent.translatedContent
    : article.content;

  const handleAudioNarration = () => {
    const textToSpeak = `${currentTitle}. Published by ${article.source?.name || "Global Wire"}. ${
      currentDesc || currentContent || ""
    }`;
    toggleNarration(articleKey, textToSpeak);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1b202c]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#38bdf8] hover:text-white uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Top Stories</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Audio Listen */}
          <button
            onClick={handleAudioNarration}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
              isCurrentlySpeaking
                ? "bg-red-950 text-red-400 border-red-800 animate-pulse"
                : "bg-[#161b26] hover:bg-[#1f2737] text-[#cbd5e1] border-[#232936]"
            }`}
            title="Text to Speech Voice Narration"
          >
            {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#38bdf8]" />}
            <span>{isCurrentlySpeaking ? "Stop Voice" : "Listen (TTS)"}</span>
          </button>

          {/* Font Size Toggle */}
          <button
            onClick={() =>
              setFontSize(fontSize === "text-base" ? "text-lg" : fontSize === "text-lg" ? "text-sm" : "text-base")
            }
            className="p-1.5 rounded bg-[#161b26] hover:bg-[#1f2737] text-[#cbd5e1] border border-[#232936] transition-colors"
            title="Adjust Text Size"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded border border-[#232936] transition-colors ${
              isBookmarked ? "text-[#38bdf8] bg-[#161b26]" : "text-[#828f9f] hover:text-white"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Save Article"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#38bdf8]" : ""}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161b26] hover:bg-[#1f2737] text-[#cbd5e1] border border-[#232936] rounded text-xs transition-colors"
            title="Share Direct Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Article Article Container */}
      <article className="rounded-2xl border border-[#202c42] bg-[#0b0f19] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)]">
        
        {/* Banner Image */}
        <div className="relative h-72 sm:h-96 w-full bg-[#07090e] border-b border-[#182030]">
          <img
            src={imageSrc}
            alt={article.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = dynamicFallback;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/30 to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-4 left-6 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-[#090d16]/95 backdrop-blur-md text-[#38bdf8] border border-[#26344d] uppercase tracking-wider shadow-lg">
              {article.source?.name || "Global Publisher"}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-950/90 text-emerald-400 border border-emerald-800 shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Dispatch
            </span>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-6 sm:p-10">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#182030] text-xs text-[#828f9f]">
            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1.5 text-[#cbd5e1] font-medium">
                <User className="w-3.5 h-3.5 text-[#38bdf8]" />
                {article.author || "Editorial Intelligence Desk"}
              </span>
              <span className="text-[#334155]">•</span>
              <span className="flex items-center gap-1 text-[#94a3b8]">
                <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                {formattedDate}
              </span>
            </div>

            {article.readTime && (
              <span className="px-2.5 py-1 rounded-md bg-[#121826] text-[#cbd5e1] font-mono text-[11px] border border-[#1e273a]">
                {article.readTime}
              </span>
            )}
          </div>

          {/* Translator Bar */}
          <div className="mb-7 p-3.5 rounded-xl bg-[#0f1524] border border-[#1f2c42] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#38bdf8]" />
              <span className="font-semibold text-white">Instant AI Translator:</span>
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value);
                  handleTranslate(e.target.value);
                }}
                className="bg-[#151d2e] border border-[#2d3e5c] text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isTranslatedView ? (
                <button
                  onClick={() => setIsTranslatedView(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2336] hover:bg-[#25324d] text-[#38bdf8] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Show Original
                </button>
              ) : (
                <button
                  onClick={() => handleTranslate(targetLang)}
                  disabled={isTranslating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isTranslating && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>
                    {isTranslating
                      ? "Translating..."
                      : "Translate to " + (LANGUAGES.find((l) => l.code === targetLang)?.label.split(" ")[0] || "English")}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl font-editorial font-bold text-white mb-6 leading-tight tracking-tight">
            {currentTitle}
          </h1>

          {/* AI Executive Intelligence Card */}
          <div className="mb-8 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-[#121927] to-[#0d1320] border border-[#23334a] shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                <span>Executive Intelligence & Key Takeaways</span>
              </div>
              {summaryData?.sentiment && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#162032] text-[#cbd5e1] font-semibold border border-[#2a3c58] font-mono">
                  Tone: {summaryData.sentiment.tone}
                </span>
              )}
            </div>

            {isLoadingSummary ? (
              <div className="py-4 flex items-center gap-2.5 text-xs text-[#94a3b8]">
                <div className="w-4 h-4 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin" />
                <span>Synthesizing intelligence dossier...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-3 text-xs text-[#cbd5e1]">
                <ul className="space-y-2">
                  {summaryData.takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-sans">
                      <span className="text-[#38bdf8] font-bold shrink-0 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {summaryData.marketImpact && (
                  <div className="mt-3.5 pt-3 border-t border-[#1e2a3d] text-xs text-[#94a3b8] leading-relaxed font-sans">
                    <strong className="text-[#cbd5e1]">Market & Strategic Impact:</strong> {summaryData.marketImpact}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Content Body */}
          <div className={`space-y-5 text-[#cbd5e1] ${fontSize} leading-relaxed font-sans`}>
            {currentDesc && (
              <p className="text-white font-medium border-l-3 border-[#2563eb] pl-4 py-2 italic bg-[#0f1422] rounded-r-lg text-base sm:text-lg">
                {currentDesc}
              </p>
            )}

            {currentContent && currentContent !== currentDesc && (
              <p className="text-[#94a3b8] leading-relaxed">
                {currentContent}
              </p>
            )}
          </div>

          {/* Source Attribution & Outbound Link */}
          <div className="mt-10 pt-6 border-t border-[#182030] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#64748b]">
              Syndicated via official publisher wire by <strong>{article.source?.name || "the publisher"}</strong>.
            </p>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#3b82f6] hover:to-[#2563eb] text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                <span>Read Full Story on {article.source?.name || "Official Source"}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

        </div>

      </article>

    </div>
  );
}

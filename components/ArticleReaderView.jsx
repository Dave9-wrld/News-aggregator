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
  const { speakingId, isPlaying, toggleNarration } = useAudioPlayer();
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
        <h2 className="text-xl font-bold text-[#112117] mb-2">Article Not Found</h2>
        <p className="text-xs text-[#738c7f] mb-6">The requested news dispatch could not be located.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16834f] text-white text-xs font-semibold uppercase tracking-wider"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#e1ece5]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#16834f] hover:text-[#126d41] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Top Stories</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Listen */}
          <button
            onClick={handleAudioNarration}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isCurrentlySpeaking
                ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                : "bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border-[#e1ece5] hover:border-[#a7ccb5]"
            }`}
            title="Text to Speech Voice Narration"
          >
            {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#16834f]" />}
            <span>{isCurrentlySpeaking ? "Stop Voice" : "Listen (TTS)"}</span>
          </button>

          {/* Font Size Toggle */}
          <button
            onClick={() =>
              setFontSize(fontSize === "text-base" ? "text-lg" : fontSize === "text-lg" ? "text-sm" : "text-base")
            }
            className="p-1.5 sm:p-2 rounded-lg bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] transition-colors cursor-pointer"
            title="Adjust Text Size"
          >
            <Type className="w-3.5 h-3.5 text-[#16834f]" />
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              isBookmarked ? "text-[#16834f] bg-[#eaf5ee] border-[#a7ccb5]" : "text-[#455c50] hover:text-[#112117] bg-[#f0f5f2] hover:bg-[#eaf5ee] border-[#e1ece5] hover:border-[#a7ccb5]"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Save Article"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#16834f]" : ""}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0f5f2] hover:bg-[#eaf5ee] text-[#455c50] hover:text-[#112117] border border-[#e1ece5] hover:border-[#a7ccb5] rounded-lg text-xs transition-colors cursor-pointer"
            title="Share Direct Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16834f]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Article Article Container */}
      <article className="rounded-2xl border border-[#e1ece5] bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        
        {/* Banner Image */}
        <div className="relative h-64 sm:h-96 w-full bg-[#f0f5f2] border-b border-[#e1ece5]">
          <img
            src={imageSrc}
            alt={article.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = dynamicFallback;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-white/95 backdrop-blur-md text-[#16834f] border border-[#e1ece5] uppercase tracking-wider shadow-sm">
              {article.source?.name || "Global Publisher"}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Dispatch
            </span>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-5 sm:p-8 lg:p-10">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#e1ece5] text-xs text-[#738c7f]">
            <div className="flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1.5 text-[#112117] font-medium">
                <User className="w-3.5 h-3.5 text-[#16834f]" />
                {article.author || "Editorial Desk"}
              </span>
              <span className="text-[#a7ccb5]">•</span>
              <span className="flex items-center gap-1 text-[#455c50]">
                <Clock className="w-3.5 h-3.5 text-[#16834f]" />
                {formattedDate}
              </span>
            </div>

            {article.readTime && (
              <span className="px-2.5 py-1 rounded-md bg-[#f0f5f2] text-[#455c50] font-mono text-[11px] border border-[#e1ece5]">
                {article.readTime}
              </span>
            )}
          </div>

          {/* Translator Bar */}
          <div className="mb-7 p-3.5 rounded-xl bg-[#f0f5f2] border border-[#e1ece5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#16834f] shrink-0" />
              <span className="font-semibold text-[#112117] whitespace-nowrap">Instant AI Translator:</span>
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value);
                  handleTranslate(e.target.value);
                }}
                className="flex-1 sm:flex-initial bg-white border border-[#e1ece5] text-[#112117] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#16834f] cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {isTranslatedView ? (
                <button
                  onClick={() => setIsTranslatedView(false)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Show Original
                </button>
              ) : (
                <button
                  onClick={() => handleTranslate(targetLang)}
                  disabled={isTranslating}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16834f] hover:bg-[#126d41] text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-editorial font-bold text-[#112117] mb-6 leading-tight tracking-tight">
            {currentTitle}
          </h1>

          {/* AI Executive Intelligence Card */}
          <div className="mb-8 p-5 sm:p-6 rounded-xl bg-[#f0f5f2] border border-[#a7ccb5]/70 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16834f] uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-[#16834f]" />
                <span>Executive Intelligence & Key Takeaways</span>
              </div>
              {summaryData?.sentiment && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-white text-[#16834f] font-semibold border border-[#a7ccb5] font-mono">
                  Tone: {summaryData.sentiment.tone}
                </span>
              )}
            </div>

            {isLoadingSummary ? (
              <div className="py-4 flex items-center gap-2.5 text-xs text-[#455c50]">
                <div className="w-4 h-4 rounded-full border-2 border-[#16834f] border-t-transparent animate-spin" />
                <span>Synthesizing intelligence dossier...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-3 text-xs text-[#455c50]">
                <ul className="space-y-2">
                  {summaryData.takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-sans">
                      <span className="text-[#16834f] font-bold shrink-0 mt-0.5">•</span>
                      <span className="text-[#112117]">{point}</span>
                    </li>
                  ))}
                </ul>

                {summaryData.marketImpact && (
                  <div className="mt-3.5 pt-3 border-t border-[#e1ece5] text-xs text-[#455c50] leading-relaxed font-sans">
                    <strong className="text-[#112117]">Market & Strategic Impact:</strong> {summaryData.marketImpact}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Content Body */}
          <div className={`space-y-5 text-[#112117] ${fontSize} leading-relaxed font-sans`}>
            {currentDesc && (
              <p className="text-[#112117] font-medium border-l-4 border-[#16834f] pl-4 py-2 italic bg-[#f0f5f2] rounded-r-lg text-base sm:text-lg">
                {currentDesc}
              </p>
            )}

            {currentContent && currentContent !== currentDesc && (
              <p className="text-[#455c50] leading-relaxed">
                {currentContent}
              </p>
            )}
          </div>

          {/* Source Attribution & Outbound Link */}
          <div className="mt-10 pt-6 border-t border-[#e1ece5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#738c7f]">
              Syndicated via official publisher wire by <strong>{article.source?.name || "the publisher"}</strong>.
            </p>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#16834f] hover:bg-[#126d41] text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
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

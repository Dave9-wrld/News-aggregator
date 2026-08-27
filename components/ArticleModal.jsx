"use client";

import { useState, useEffect } from "react";
import { 
  X, ExternalLink, Bookmark, Share2, Clock, User, Check, Sparkles, 
  Volume2, VolumeX, Type, ShieldCheck, Languages, RefreshCw 
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

export default function ArticleModal({
  article,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onShare,
}) {
  const { speakingId, isPlaying, toggleNarration, stopNarration } = useAudioPlayer();
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

  useEffect(() => {
    if (!isOpen || !article) {
      setSummaryData(null);
      setTranslatedContent(null);
      setIsTranslatedView(false);
      return;
    }

    // Lock body scrolling when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key listener to close modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Automatically load AI Executive Summary on open
    const fetchSummary = async () => {
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
        if (data.summary) {
          setSummaryData(data.summary);
        }
      } catch (err) {
        console.warn("Summary generation notice:", err);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, article, onClose]);

  if (!isOpen || !article) return null;

  const dynamicFallback = getDynamicArticleImage(article.title, article.category);
  const imageSrc = article.urlToImage || dynamicFallback;
  const formattedDate = formatPublishedDate(article.publishedAt);

  const handleCopy = () => {
    const shareUrl = article.id
      ? `${window.location.origin}/article/${article.id}`
      : article.url || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleToggleAudio = () => {
    const narrationText = `${currentTitle}. Published by ${article.source?.name || "Global Wire"}. ${
      currentDesc || currentContent || ""
    }`;
    toggleNarration(articleKey, narrationText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#202c42] bg-[#0b0f19] shadow-[0_25px_70px_rgba(0,0,0,0.8)] z-10 my-6 max-h-[90vh] flex flex-col">
        
        {/* Top Image Banner */}
        <div className="relative h-60 sm:h-72 w-full bg-[#07090e] shrink-0 border-b border-[#182030]">
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

          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#07090e]/80 backdrop-blur-md hover:bg-[#161d2d] text-white border border-[#202c42] transition-colors shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Source Tag */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-md bg-[#090d16]/95 backdrop-blur-md text-[#38bdf8] border border-[#26344d] uppercase tracking-wider shadow-lg">
              {article.source?.name || "Global Publisher"}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-950/90 text-emerald-400 border border-emerald-800 shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Dispatch
            </span>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          
          {/* Metadata & Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182030] text-xs text-[#828f9f]">
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

            <div className="flex items-center gap-2">
              {/* Audio Listen */}
              <button
                onClick={handleToggleAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isCurrentlySpeaking
                    ? "bg-red-950 text-red-400 border-red-800 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                    : "bg-[#101624] hover:bg-[#182032] text-[#cbd5e1] border-[#1e273a]"
                }`}
                title="Text to Speech Voice Narration"
              >
                {isCurrentlySpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#38bdf8]" />}
                <span>{isCurrentlySpeaking ? "Stop" : "Listen"}</span>
              </button>

              {/* Font Size Toggle */}
              <button
                onClick={() => setFontSize(fontSize === "text-base" ? "text-lg" : fontSize === "text-lg" ? "text-sm" : "text-base")}
                className="p-2 rounded-lg bg-[#101624] hover:bg-[#182032] text-[#cbd5e1] border border-[#1e273a] transition-all cursor-pointer"
                title="Adjust Text Size"
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              {/* Bookmark */}
              <button
                onClick={() => onToggleBookmark(article)}
                className={`p-2 rounded-lg border border-[#1e273a] transition-all cursor-pointer ${
                  isBookmarked ? "text-[#38bdf8] bg-[#162032] border-[#2c3d5e]" : "text-[#828f9f] hover:text-white bg-[#101624] hover:bg-[#182032]"
                }`}
                title="Save Article"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#38bdf8]" : ""}`} />
              </button>

              {/* Copy / Share */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101624] hover:bg-[#182032] text-[#cbd5e1] border border-[#1e273a] rounded-lg text-xs transition-all cursor-pointer"
                title="Copy Share Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Universal In-App Translator Bar */}
          <div className="my-5 p-3.5 rounded-xl bg-[#0f1524] border border-[#1f2c42] flex flex-wrap items-center justify-between gap-3 text-xs">
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
                  <span>{isTranslating ? "Translating..." : "Translate to " + (LANGUAGES.find(l => l.code === targetLang)?.label.split(" ")[0] || "English")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-3xl font-editorial font-bold text-white my-5 leading-tight tracking-tight">
            {currentTitle}
          </h2>

          {/* AI Executive Intelligence Section */}
          <div className="mb-7 p-5 rounded-xl bg-gradient-to-br from-[#121927] to-[#0d1320] border border-[#23334a] shadow-lg">
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
                <span>Synthesizing executive brief...</span>
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
                  <div className="mt-3.5 pt-3 border-t border-[#1e2a3d] text-[11px] text-[#94a3b8] font-sans">
                    <strong className="text-[#cbd5e1]">Market & Sector Impact:</strong> {summaryData.marketImpact}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Article Description & Content Body */}
          <div className={`space-y-4 text-[#cbd5e1] ${fontSize} leading-relaxed font-sans`}>
            {currentDesc && (
              <p className="text-white font-medium border-l-3 border-[#2563eb] pl-4 py-2 italic bg-[#0f1422] rounded-r-lg">
                {currentDesc}
              </p>
            )}

            {currentContent && currentContent !== currentDesc && (
              <p className="text-[#94a3b8] leading-relaxed">
                {currentContent}
              </p>
            )}
          </div>

          {/* Outbound Link & Deep Permalink */}
          <div className="mt-8 pt-6 border-t border-[#1b202c] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#64748b]">
              Full investigative text syndicated from official wires by <strong>{article.source?.name || "the publisher"}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  <span>Read on {article.source?.name || "Official Source"}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
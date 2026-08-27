"use client";

import { useState, useEffect } from "react";
import { Search, Bookmark, X, Newspaper, Radio } from "lucide-react";

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  onClearSearch,
  bookmarksCount,
  onOpenBookmarks,
}) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  return (
    <header className="w-full bg-[#07090e]/90 backdrop-blur-md border-b border-[#182030] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-6">

          {/* Left: Logo + Live Pulse */}
          <div className="flex items-center gap-4 shrink-0">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#131a29] to-[#0c101a] border border-[#243047] flex items-center justify-center text-[#38bdf8] group-hover:border-[#38bdf8]/60 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all duration-300">
                <Newspaper className="w-5 h-5 group-hover:scale-105 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none font-sans">
                    THE GLOBAL CHRONICLE
                  </h1>
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#64748b] font-mono mt-1 hidden sm:block">
                  {currentDate}
                </p>
              </div>
            </a>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-lg hidden md:block">
            <form onSubmit={onSearchSubmit} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#38bdf8] transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search headlines, stories, or topics..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#0e131f] border border-[#1e273a] focus:border-[#38bdf8]/60 focus:bg-[#111726] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]/40 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526077] hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile search */}
            <form onSubmit={onSearchSubmit} className="md:hidden relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stories..."
                className="w-36 pl-8 pr-7 py-1.5 text-xs bg-[#0e131f] border border-[#1e273a] focus:border-[#38bdf8]/60 rounded-lg text-white placeholder-[#475569] focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#526077] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            <button
              onClick={onOpenBookmarks}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e131f] hover:bg-[#161d2d] text-[#94a3b8] hover:text-white border border-[#1e273a] hover:border-[#2f3d59] text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="hidden sm:inline">Saved</span>
              {bookmarksCount > 0 && (
                <span className="bg-[#38bdf8] text-[#07090e] text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center justify-center font-mono">
                  {bookmarksCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
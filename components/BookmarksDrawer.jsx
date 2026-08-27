"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Trash2, Bookmark, BookOpen, Download, Search, ExternalLink } from "lucide-react";

export default function BookmarksDrawer({
  isOpen,
  onClose,
  bookmarks = [],
  onRemoveBookmark,
  onClearAll,
  onOpenArticle
}) {
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBookmarks = bookmarks.filter((b) =>
    (b.title + " " + (b.source?.name || "")).toLowerCase().includes(filterText.toLowerCase())
  );

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `saved-stories-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d1017] border-l border-[#232936] p-6 flex flex-col justify-between shadow-2xl">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#232936]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Saved Reading List ({bookmarks.length})
                </h3>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-[#64748b] hover:text-white rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar */}
            {bookmarks.length > 0 && (
              <div className="pt-3 pb-2 space-y-2">
                {/* Search in bookmarks */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search saved stories..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#12161f] border border-[#232936] rounded text-xs text-white placeholder-[#526077] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3 h-3" /> Export Archive (.JSON)
                  </button>
                  <button
                    onClick={onClearAll}
                    className="text-[11px] text-[#ef4444] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear list
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="mt-2 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-16 text-[#64748b]">
                  <p className="text-sm font-medium">
                    {filterText ? "No matching saved articles" : "No saved articles"}
                  </p>
                  <p className="text-xs mt-1">Bookmark any story to access it here anytime.</p>
                </div>
              ) : (
                filteredBookmarks.map((article, idx) => (
                  <div
                    key={article.url || article.id || idx}
                    className="p-3 rounded bg-[#131823] border border-[#232936] hover:border-[#334155] transition-colors flex gap-3"
                  >
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt=""
                        className="w-14 h-14 rounded object-cover shrink-0 bg-[#0a0c10]"
                        onError={(e) => { 
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none"; 
                        }}
                      />
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-wider">
                          {article.source?.name || "News"}
                        </span>
                        <h4
                          onClick={() => {
                            onOpenArticle(article);
                            onClose();
                          }}
                          className="text-xs font-semibold text-white line-clamp-2 hover:text-[#93c5fd] cursor-pointer"
                        >
                          {article.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1b202c]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onOpenArticle(article);
                              onClose();
                            }}
                            className="text-[11px] font-medium text-[#38bdf8] flex items-center gap-1 hover:underline"
                          >
                            <BookOpen className="w-3 h-3" /> Quick View
                          </button>
                          {article.id && (
                            <Link
                              href={`/article/${article.id}`}
                              onClick={onClose}
                              className="text-[10px] text-[#94a3b8] hover:text-white flex items-center gap-0.5"
                              title="Open Full Page"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>Full Page</span>
                            </Link>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveBookmark(article)}
                          className="text-[#64748b] hover:text-[#ef4444] p-1 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#232936] text-center">
            <p className="text-[11px] text-[#64748b]">
              Saved locally in browser storage • Exportable anytime
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
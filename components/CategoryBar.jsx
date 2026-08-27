"use client";

export const CATEGORIES = [
  { id: "all", label: "Top Stories" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business & Finance" },
  { id: "science", label: "Science" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Culture & Arts" },
  { id: "health", label: "Health" },
];

export default function CategoryBar({
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <div className="w-full bg-[#090d15]/90 backdrop-blur-sm border-b border-[#182030] py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#162032] text-[#38bdf8] border border-[#2b3d5e] shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    : "text-[#8292a9] hover:text-white hover:bg-[#101622]"
                }`}
              >
                {cat.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
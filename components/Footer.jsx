export default function Footer() {
  return (
    <footer className="w-full bg-[#05070a] border-t border-[#151c2a] mt-24 pt-12 pb-10 text-[#64748b] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#131926]">
          <div>
            <span className="text-lg font-editorial font-bold text-white tracking-wide">
              THE GLOBAL CHRONICLE
            </span>
            <p className="text-xs text-[#64748b] mt-1">
              Independent International News & Intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#94a3b8]">
            <a href="/" className="hover:text-[#38bdf8] transition-colors">Top Stories</a>
            <a href="/?category=technology" className="hover:text-[#38bdf8] transition-colors">Technology</a>
            <a href="/?category=business" className="hover:text-[#38bdf8] transition-colors">Markets</a>
            <a href="/?category=science" className="hover:text-[#38bdf8] transition-colors">Science</a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#526077]">
          <p>© {new Date().getFullYear()} The Global Chronicle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
export default function LoadingSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {
        
      }
      <div className="h-96 rounded-3xl bg-zinc-900/60 border border-zinc-800" />

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-80 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between p-5">
            <div className="h-40 rounded-xl bg-zinc-800/60 w-full mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800/60 rounded w-1/2" />
            </div>



            <div className="h-4 bg-zinc-800/40 rounded w-1/3 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

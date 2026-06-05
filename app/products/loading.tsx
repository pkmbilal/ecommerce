export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-4 w-24 animate-pulse rounded bg-emerald-100" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded bg-zinc-200" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-10 w-24 animate-pulse rounded-full bg-zinc-200"
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[4/5] animate-pulse rounded-lg bg-zinc-200" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-5 w-full animate-pulse rounded bg-zinc-200" />
            <div className="mt-5 h-10 animate-pulse rounded-full bg-zinc-300" />
          </div>
        ))}
      </div>
    </main>
  );
}

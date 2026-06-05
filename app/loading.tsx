export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="h-10 w-40 animate-pulse rounded-full bg-zinc-200" />
          <div className="mt-6 h-16 w-full max-w-xl animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-4 h-16 w-4/5 animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-8 h-12 w-44 animate-pulse rounded-full bg-zinc-300" />
        </div>
        <div className="h-[420px] animate-pulse rounded-lg bg-zinc-200" />
      </div>
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[4/5] animate-pulse rounded-lg bg-zinc-200" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-5 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </main>
  );
}

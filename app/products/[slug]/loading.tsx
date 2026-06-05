export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-5 w-36 animate-pulse rounded bg-zinc-200" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="aspect-[4/5] animate-pulse rounded-lg bg-zinc-200" />
        <div className="py-8">
          <div className="h-4 w-24 animate-pulse rounded bg-emerald-100" />
          <div className="mt-4 h-12 w-4/5 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-12 w-3/5 animate-pulse rounded bg-zinc-200" />
          <div className="mt-8 h-8 w-44 animate-pulse rounded bg-zinc-200" />
          <div className="mt-8 h-24 w-full animate-pulse rounded bg-zinc-200" />
          <div className="mt-8 h-10 w-64 animate-pulse rounded-full bg-zinc-300" />
        </div>
      </div>
    </main>
  );
}

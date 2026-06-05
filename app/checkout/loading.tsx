export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-4 w-36 animate-pulse rounded bg-emerald-100" />
      <div className="mt-3 h-12 w-56 animate-pulse rounded bg-zinc-200" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.82fr]">
        <div className="h-[520px] animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-[420px] animate-pulse rounded-lg bg-zinc-200" />
      </div>
    </main>
  );
}

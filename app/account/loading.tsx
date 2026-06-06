export default function AccountLoading() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-10">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-9 w-56 rounded bg-zinc-200" />
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.72fr]">
          <div className="h-64 rounded-lg bg-zinc-100" />
          <div className="h-64 rounded-lg bg-zinc-100" />
        </div>
      </div>
    </main>
  );
}

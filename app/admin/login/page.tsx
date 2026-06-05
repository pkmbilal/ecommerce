import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login | SAHA",
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const hasError = Boolean(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-4">
      <form
        action="/api/admin/login"
        method="post"
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          SAHA admin
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Order management
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Enter the admin access token to manage COD orders.
        </p>
        <label className="mt-6 grid gap-2">
          <span className="text-sm font-bold text-zinc-950">Access token</span>
          <input
            name="token"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 rounded-full border border-zinc-200 px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
          />
        </label>
        {hasError ? (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            Invalid admin access token.
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-6 h-12 w-full rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}

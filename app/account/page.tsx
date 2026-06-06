import type { Metadata } from "next";
import Link from "next/link";

import { requireCustomerSession } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Account | SAHA",
};

type AccountPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [profile, params] = await Promise.all([
    requireCustomerSession(),
    searchParams,
  ]);
  const isAdmin = profile.role === "admin";
  const hasAdminError = getSingleParam(params.error) === "admin";

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
              SAHA account
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
              Account dashboard
            </h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="h-11 rounded-full border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-950 transition hover:border-zinc-950"
            >
              Sign out
            </button>
          </form>
        </div>

        {hasAdminError ? (
          <p className="mt-6 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            This account does not have admin access.
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.72fr]">
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-2xl font-black text-zinc-950">Profile</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <Detail label="Email" value={profile.email} />
              <Detail label="Name" value={profile.fullName ?? "Not set"} />
              <Detail label="Role" value={profile.role} />
            </dl>
          </section>

          <aside className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-2xl font-black text-zinc-950">Quick links</h2>
            <div className="mt-5 grid gap-3">
              <Link
                href="/products"
                className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:border-zinc-950"
              >
                Browse products
              </Link>
              <Link
                href="/checkout"
                className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:border-zinc-950"
              >
                Go to checkout
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin/orders"
                  className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  Open admin dashboard
                </Link>
              ) : (
                <p className="rounded-lg bg-zinc-50 p-3 text-sm font-semibold text-zinc-600">
                  Customer order lookup will appear here when that launch
                  feature is implemented.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold text-zinc-500">{label}</dt>
      <dd className="mt-1 font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

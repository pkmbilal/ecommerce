import type { Metadata } from "next";

import { getSafeInternalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Sign In | SAHA",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
    registered?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = getSingleParam(params.error);
  const next = getSafeInternalPath(getSingleParam(params.next));
  const registered = getSingleParam(params.registered) === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          SAHA account
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Admin users are sent to the admin workspace. Customers are sent to
          their account page.
        </p>

        <form action="/api/auth/login" method="post" className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Email" name="email" type="email" />
          <Field label="Password" name="password" type="password" />
          {error ? (
            <p className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {getErrorMessage(error)}
            </p>
          ) : null}
          {registered ? (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Account created. Sign in to continue.
            </p>
          ) : null}
          <button
            type="submit"
            className="h-12 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Sign in
          </button>
        </form>

        <form
          action="/api/auth/signup"
          method="post"
          className="mt-6 border-t border-zinc-200 pt-6"
        >
          <input type="hidden" name="next" value={next ?? ""} />
          <h2 className="text-lg font-black text-zinc-950">Create account</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Full name" name="fullName" />
            <Field label="Email" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
            <button
              type="submit"
              className="h-12 rounded-full border border-zinc-300 px-5 text-sm font-bold text-zinc-950 transition hover:border-zinc-950"
            >
              Create customer account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-950">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={type === "password" ? "current-password" : undefined}
        className="h-12 rounded-full border border-zinc-200 px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
      />
    </label>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: string) {
  if (error === "setup") {
    return "Supabase environment variables are missing. Add .env.local and restart the dev server.";
  }

  if (error === "signup") {
    return "Unable to create that account. Try a different email or password.";
  }

  return "Invalid email or password.";
}

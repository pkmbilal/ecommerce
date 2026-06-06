import type { Metadata } from "next";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel } from "@/components/admin/tailadmin/primitives";
import { requireCustomerSession } from "@/lib/admin/auth";
import { getCustomerProfile } from "@/lib/customer/account";

export const metadata: Metadata = {
  title: "Profile | SAHA Account",
};

type ProfilePageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [session, params] = await Promise.all([
    requireCustomerSession(),
    searchParams,
  ]);
  const profile = await getCustomerProfile(session.userId);
  const status = getSingleParam(params.status);

  return (
    <AccountShell
      profile={profile}
      title="Profile"
      subtitle="Keep your contact details ready for Saudi cash on delivery orders."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <AdminPanel title="Account details" description="Email is used for sign in.">
          <form action="/api/account/profile" method="post" className="grid gap-5 p-5">
            {status ? <StatusMessage status={status} /> : null}
            <Field
              label="Full name"
              name="fullName"
              defaultValue={profile.fullName ?? ""}
              autoComplete="name"
              required
            />
            <Field
              label="Saudi phone number"
              name="phone"
              defaultValue={profile.phone ?? ""}
              autoComplete="tel"
              inputMode="tel"
              placeholder="05XXXXXXXX"
            />
            <Field label="Email" name="email" defaultValue={profile.email} disabled />
            <button
              type="submit"
              className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Save profile
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Account access" description="Your current role and permissions.">
          <dl className="grid gap-4 p-5 text-sm">
            <Detail label="Role" value={profile.role} />
            <Detail
              label="Dashboard access"
              value="Profile, addresses, favorites, and linked COD orders"
            />
            <Detail label="Payments" value="Cash on delivery only" />
          </dl>
        </AdminPanel>
      </div>
    </AccountShell>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <input
        name={name}
        className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 shadow-theme-xs outline-none transition focus:border-emerald-300 focus:ring-3 focus:ring-emerald-700/10 disabled:bg-gray-50 disabled:text-gray-500"
        {...props}
      />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function StatusMessage({ status }: { status: string }) {
  const isError = status === "profile_error";

  return (
    <p
      className={`rounded-lg p-3 text-sm font-semibold ${
        isError ? "bg-error-50 text-error-700" : "bg-success-50 text-success-700"
      }`}
    >
      {isError ? "Check your profile details and try again." : "Profile saved."}
    </p>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

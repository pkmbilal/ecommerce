import type { Metadata } from "next";
import Image from "next/image";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel } from "@/components/admin/tailadmin/primitives";
import { requireCustomerDashboardSession } from "@/lib/admin/auth";
import { getCustomerProfile } from "@/lib/customer/account";

import { StatusMessage } from "./status-message";

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
    requireCustomerDashboardSession(),
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
      <div className="grid gap-6">
        <AdminPanel title="Account details" description="Email is used for sign in.">
          <form
            action="/api/account/profile"
            method="post"
            encType="multipart/form-data"
            className="grid gap-5 p-5"
          >
            {status ? <StatusMessage status={status} /> : null}
            <AvatarField
              avatarUrl={profile.avatarUrl}
              fullName={profile.fullName}
              email={profile.email}
            />
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
      </div>
    </AccountShell>
  );
}

function AvatarField({
  avatarUrl,
  fullName,
  email,
}: {
  avatarUrl?: string;
  fullName?: string;
  email: string;
}) {
  const displayName = fullName || email;
  const initials = getInitials(displayName, email);

  return (
    <div className="grid gap-3 rounded-lg border border-gray-200 bg-[#fbfaf7] p-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="relative grid size-20 place-items-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-900 text-xl font-bold text-white shadow-theme-sm">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${displayName} profile image`}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
      <div className="grid min-w-0 gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Profile image</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Upload a JPEG, PNG, WebP, or AVIF image up to 2 MB.
          </p>
        </div>
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="block w-full text-sm font-medium text-gray-700 file:mr-4 file:h-10 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
        />
        {avatarUrl ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <input
              type="checkbox"
              name="removeAvatar"
              className="size-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700/20"
            />
            Remove current profile image
          </label>
        ) : null}
      </div>
    </div>
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

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getInitials(name: string, email: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const source = parts[0] || email;

  return source.slice(0, 2).toUpperCase();
}

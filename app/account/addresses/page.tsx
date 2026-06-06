import { MapPin } from "lucide-react";
import type { Metadata } from "next";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel, AdminStatusBadge } from "@/components/admin/tailadmin/primitives";
import { requireCustomerSession } from "@/lib/admin/auth";
import { getCustomerProfile, listCustomerAddresses, type CustomerAddress } from "@/lib/customer/account";

export const metadata: Metadata = {
  title: "Addresses | SAHA Account",
};

type AddressesPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

export default async function AddressesPage({ searchParams }: AddressesPageProps) {
  const [session, params] = await Promise.all([
    requireCustomerSession(),
    searchParams,
  ]);
  const [profile, addresses] = await Promise.all([
    getCustomerProfile(session.userId),
    listCustomerAddresses(session.userId),
  ]);
  const status = getSingleParam(params.status);

  return (
    <AccountShell
      profile={profile}
      title="Addresses"
      subtitle="Save Saudi delivery details for faster cash on delivery checkout."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel title="New address" description="Add a delivery location.">
          <AddressForm action="/api/account/addresses" status={status} />
        </AdminPanel>

        <AdminPanel title="Saved addresses" description="Manage checkout destinations.">
          {addresses.length > 0 ? (
            <div className="grid gap-4 p-5">
              {addresses.map((address) => (
                <SavedAddressCard key={address.id} address={address} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MapPin aria-hidden="true" className="mx-auto size-10 text-gray-300" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No saved addresses
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Add your first delivery address to keep checkout details ready.
              </p>
            </div>
          )}
        </AdminPanel>
      </div>
    </AccountShell>
  );
}

function SavedAddressCard({ address }: { address: CustomerAddress }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{address.label}</h3>
            {address.isDefault ? (
              <AdminStatusBadge tone="success">Default</AdminStatusBadge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {address.recipientName} · {address.phone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!address.isDefault ? (
            <form action={`/api/account/addresses/${address.id}`} method="post">
              <input type="hidden" name="intent" value="default" />
              <button
                type="submit"
                className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Make default
              </button>
            </form>
          ) : null}
          <form action={`/api/account/addresses/${address.id}`} method="post">
            <input type="hidden" name="intent" value="delete" />
            <button
              type="submit"
              className="h-9 rounded-lg border border-error-500/20 px-3 text-xs font-semibold text-error-700 hover:bg-error-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="City or region" value={address.cityRegion} />
        <Detail label="Address" value={address.deliveryAddress} />
        {address.notes ? <Detail label="Notes" value={address.notes} /> : null}
      </dl>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-emerald-700">
          Edit address
        </summary>
        <AddressForm action={`/api/account/addresses/${address.id}`} address={address} />
      </details>
    </article>
  );
}

function AddressForm({
  action,
  address,
  status,
}: {
  action: string;
  address?: CustomerAddress;
  status?: string;
}) {
  return (
    <form action={action} method="post" className="grid gap-4 p-5">
      {status ? <StatusMessage status={status} /> : null}
      <Field label="Label" name="label" defaultValue={address?.label ?? ""} placeholder="Home" required />
      <Field
        label="Recipient name"
        name="recipientName"
        defaultValue={address?.recipientName ?? ""}
        autoComplete="name"
        required
      />
      <Field
        label="Saudi phone number"
        name="phone"
        defaultValue={address?.phone ?? ""}
        autoComplete="tel"
        inputMode="tel"
        placeholder="05XXXXXXXX"
        required
      />
      <Field
        label="City or region"
        name="cityRegion"
        defaultValue={address?.cityRegion ?? ""}
        autoComplete="address-level2"
        required
      />
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-gray-900">Delivery address</span>
        <textarea
          name="deliveryAddress"
          defaultValue={address?.deliveryAddress ?? ""}
          rows={4}
          required
          autoComplete="street-address"
          className="resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 shadow-theme-xs outline-none transition focus:border-emerald-300 focus:ring-3 focus:ring-emerald-700/10"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-gray-900">Notes</span>
        <textarea
          name="notes"
          defaultValue={address?.notes ?? ""}
          rows={3}
          className="resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 shadow-theme-xs outline-none transition focus:border-emerald-300 focus:ring-3 focus:ring-emerald-700/10"
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="size-4 rounded border-gray-300 text-emerald-700"
        />
        Use as default delivery address
      </label>
      <button
        type="submit"
        className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {address ? "Save address" : "Add address"}
      </button>
    </form>
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
        className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 shadow-theme-xs outline-none transition focus:border-emerald-300 focus:ring-3 focus:ring-emerald-700/10"
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
  const isError = status === "address_error";
  const message =
    status === "address_deleted"
      ? "Address deleted."
      : status === "address_default"
        ? "Default address updated."
        : isError
          ? "Check your address details and try again."
          : "Address saved.";

  return (
    <p
      className={`rounded-lg p-3 text-sm font-semibold ${
        isError ? "bg-error-50 text-error-700" : "bg-success-50 text-success-700"
      }`}
    >
      {message}
    </p>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

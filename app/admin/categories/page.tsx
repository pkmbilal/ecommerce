import type { Metadata } from "next";

import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import {
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminCategories, type AdminCategory } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Admin Categories | SAHA",
};

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    saved?: string | string[];
  }>;
};

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const profile = await requireAdminSession();

  const params = await searchParams;
  const categories = await listAdminCategories();
  const error = getSingleParam(params.error);
  const saved = getSingleParam(params.saved) === "1";

  return (
    <TailAdminShell
      profile={profile}
      title="Categories"
      subtitle="Organize storefront browsing and product grouping."
    >
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
        <AdminPanel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">New category</h2>
            <StatusMessages error={error} saved={saved} />
          </div>
          <CategoryForm action="/api/admin/categories" />
        </AdminPanel>

        <AdminPanel className="overflow-hidden">
          <div className="grid grid-cols-[1fr_0.7fr_0.5fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-500 max-md:hidden">
            <span>Category</span>
            <span>Slug</span>
            <span>Status</span>
          </div>
          {categories.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {categories.map((category) => (
                <details key={category.id} className="group">
                  <summary className="grid cursor-pointer gap-3 px-5 py-4 transition hover:bg-gray-50 md:grid-cols-[1fr_0.7fr_0.5fr] md:items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      {category.description ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {category.slug}
                    </p>
                    <AdminStatusBadge tone={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </AdminStatusBadge>
                  </summary>
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                    <CategoryForm
                      action={`/api/admin/categories/${category.id}`}
                      category={category}
                      compact
                    />
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                No categories found
              </h2>
              <p className="mt-2 text-gray-500">
                Create a category before adding real catalog products.
              </p>
            </div>
          )}
        </AdminPanel>
      </div>
    </TailAdminShell>
  );
}

function CategoryForm({
  action,
  category,
  compact,
}: {
  action: string;
  category?: AdminCategory;
  compact?: boolean;
}) {
  return (
    <form
      action={action}
      method="post"
      className={`grid gap-4 ${compact ? "md:grid-cols-2" : "mt-5"}`}
    >
      <Field label="Name" name="name" defaultValue={category?.name} />
      <Field label="Slug" name="slug" defaultValue={category?.slug} />
      <Field
        label="Sort order"
        name="sortOrder"
        type="number"
        defaultValue={String(category?.sortOrder ?? 0)}
      />
      <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
        Description
        <textarea
          name="description"
          rows={compact ? 2 : 3}
          defaultValue={category?.description}
          className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="size-4 accent-brand-500"
        />
        Active
      </label>
      <button
        type="submit"
        className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 md:w-fit"
      >
        {category ? "Save category" : "Create category"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
      />
    </label>
  );
}

function StatusMessages({
  error,
  saved,
}: {
  error?: string;
  saved?: boolean;
}) {
  if (error) {
    return (
      <p className="rounded-lg bg-error-50 px-3 py-1 text-sm font-medium text-error-700">
        {error}
      </p>
    );
  }

  if (saved) {
    return (
      <p className="rounded-lg bg-success-50 px-3 py-1 text-sm font-medium text-success-700">
        Saved
      </p>
    );
  }

  return null;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

import type { Metadata } from "next";

import { AdminShell } from "@/app/admin/orders/page";
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
  await requireAdminSession();

  const params = await searchParams;
  const categories = await listAdminCategories();
  const error = getSingleParam(params.error);
  const saved = getSingleParam(params.saved) === "1";

  return (
    <AdminShell
      title="Categories"
      subtitle="Organize storefront browsing and product grouping."
    >
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-zinc-950">New category</h2>
            <StatusMessages error={error} saved={saved} />
          </div>
          <CategoryForm action="/api/admin/categories" />
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="grid grid-cols-[1fr_0.7fr_0.5fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 max-md:hidden">
            <span>Category</span>
            <span>Slug</span>
            <span>Status</span>
          </div>
          {categories.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {categories.map((category) => (
                <details key={category.id} className="group">
                  <summary className="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-emerald-50 md:grid-cols-[1fr_0.7fr_0.5fr] md:items-center">
                    <div>
                      <p className="font-black text-zinc-950">{category.name}</p>
                      {category.description ? (
                        <p className="mt-1 text-sm text-zinc-500">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-zinc-700">
                      {category.slug}
                    </p>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        category.isActive
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </summary>
                  <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-5">
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
              <h2 className="text-xl font-black text-zinc-950">
                No categories found
              </h2>
              <p className="mt-2 text-zinc-600">
                Create a category before adding real catalog products.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
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
      <label className="grid gap-2 text-sm font-bold text-zinc-700 md:col-span-2">
        Description
        <textarea
          name="description"
          rows={compact ? 2 : 3}
          defaultValue={category?.description}
          className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-700"
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="size-4 accent-emerald-800"
        />
        Active
      </label>
      <button
        type="submit"
        className="h-11 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 md:w-fit"
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
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-700"
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
      <p className="rounded-full bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700">
        {error}
      </p>
    );
  }

  if (saved) {
    return (
      <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
        Saved
      </p>
    );
  }

  return null;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

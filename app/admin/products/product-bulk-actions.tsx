"use client";

import { Archive, CheckSquare, Tags } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { ConfirmSubmitButton } from "@/app/admin/products/confirm-submit-button";
import { ProductStatusToggle } from "@/app/admin/products/product-status-toggle";
import { AdminStatusBadge } from "@/components/admin/tailadmin/primitives";
import type { AdminCategory, AdminProductSummary } from "@/lib/admin/catalog";
import { formatSar } from "@/lib/money";

type ProductBulkActionsProps = {
  products: AdminProductSummary[];
  categories: AdminCategory[];
  returnTo: string;
};

type BulkAction =
  | "activate"
  | "deactivate"
  | "archive"
  | "feature"
  | "unfeature"
  | "assign_category"
  | "set_stock";

export function ProductBulkActions({
  products,
  categories,
  returnTo,
}: ProductBulkActionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkAction>("activate");
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmedSubmitRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const allSelected =
    products.length > 0 && selectedIds.size === products.length;

  function toggleProduct(productId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      allSelected ? new Set() : new Set(products.map((product) => product.id)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedSubmitRef.current) {
      confirmedSubmitRef.current = false;
      return;
    }

    event.preventDefault();

    if (selectedIds.size === 0) {
      return;
    }

    openDialog();
  }

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function submitConfirmed() {
    confirmedSubmitRef.current = true;
    closeDialog();
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      <form
        ref={formRef}
        action="/api/admin/products/bulk"
        method="post"
        className="border-b border-gray-200 bg-white px-5 py-4"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        {Array.from(selectedIds).map((productId) => (
          <input key={productId} type="hidden" name="productId" value={productId} />
        ))}

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-2 text-sm font-medium text-gray-700">
            Selection
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/20"
              >
                <CheckSquare className="size-4" aria-hidden="true" />
                {allSelected ? "Clear page" : "Select page"}
              </button>
              <span className="text-sm font-medium text-gray-500">
                {selectedIds.size} selected
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(180px,0.8fr)_minmax(180px,0.75fr)_minmax(140px,0.55fr)_minmax(180px,0.85fr)_auto] md:items-end">
            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Bulk action
              <select
                name="bulkAction"
                value={action}
                onChange={(event) => setAction(event.target.value as BulkAction)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
              >
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="archive">Archive</option>
                <option value="feature">Set featured</option>
                <option value="unfeature">Remove featured</option>
                <option value="assign_category">Assign category</option>
                <option value="set_stock">Set stock</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Category
              <select
                name="categoryId"
                disabled={action !== "assign_category"}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
              >
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Target stock
              <input
                type="number"
                name="targetStockOnHand"
                min={0}
                disabled={action !== "set_stock"}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Reason
              <input
                type="text"
                name="reason"
                defaultValue="Admin bulk stock adjustment"
                disabled={action !== "set_stock"}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
              />
            </label>

            <button
              type="submit"
              disabled={selectedIds.size === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {action === "archive" ? (
                <Archive className="size-4" aria-hidden="true" />
              ) : (
                <Tags className="size-4" aria-hidden="true" />
              )}
              Apply
            </button>
          </div>
        </div>
      </form>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed inset-0 m-auto w-[min(92vw,460px)] rounded-lg border border-gray-200 bg-white p-0 text-left shadow-theme-md backdrop:bg-gray-900/45"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
      >
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Apply bulk action
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-gray-500">
            This will apply {getBulkActionLabel(action).toLowerCase()} to{" "}
            {selectedIds.size} selected product
            {selectedIds.size === 1 ? "" : "s"}.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/20"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/20"
              onClick={submitConfirmed}
            >
              Apply action
            </button>
          </div>
        </div>
      </dialog>

      {products.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          isSelected={selectedIds.has(product.id)}
          onToggle={() => toggleProduct(product.id)}
        />
      ))}
    </div>
  );
}

function getBulkActionLabel(action: BulkAction) {
  switch (action) {
    case "activate":
      return "Activate";
    case "deactivate":
      return "Deactivate";
    case "archive":
      return "Archive";
    case "feature":
      return "Set featured";
    case "unfeature":
      return "Remove featured";
    case "assign_category":
      return "Assign category";
    case "set_stock":
      return "Set stock";
    default:
      return action;
  }
}

function ProductRow({
  product,
  isSelected,
  onToggle,
}: {
  product: AdminProductSummary;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-4 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50 lg:grid-cols-[auto_1.45fr_0.72fr_0.65fr_0.62fr_0.56fr_0.82fr] lg:items-center">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={`Select ${product.title}`}
          className="size-4 rounded border-gray-300 accent-brand-500"
        />
        <span className="lg:hidden">Select product</span>
      </label>
      <Link
        href={`/admin/products/${product.id}`}
        className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-brand-500/20"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{product.title}</p>
          <p className="mt-1 truncate text-sm text-gray-500">
            {product.sku} - {product.slug}
          </p>
        </div>
      </Link>
      <p className="text-sm font-medium text-gray-700">
        {product.categoryName ?? "Unassigned"}
      </p>
      <div className="text-sm font-medium text-gray-700">
        <p>{product.stockOnHand} on hand</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          <span className="text-gray-500">{product.reservedQuantity} reserved</span>
          {product.isLowStock ? (
            <span className="font-semibold text-warning-500">Low stock</span>
          ) : null}
        </div>
      </div>
      <p className="font-semibold text-gray-900">
        {formatSar(product.priceHalalas)}
      </p>
      <div className="flex flex-wrap gap-2">
        <ProductStatusToggle
          action={`/api/admin/products/${product.id}`}
          isActive={product.isActive}
          productTitle={product.title}
        />
        {product.isFeatured ? <Flag isActive>Favorite</Flag> : null}
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Link
          href={`/admin/products/${product.id}`}
          className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit
        </Link>
        <form action={`/api/admin/products/${product.id}`} method="post">
          <input type="hidden" name="intent" value="archive" />
          <ConfirmSubmitButton
            message={`Archive ${product.title}? It will be hidden from the storefront.`}
            className="h-9 rounded-lg border border-error-200 bg-white px-3 text-sm font-semibold text-error-700 hover:bg-error-50"
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

function Flag({
  isActive,
  children,
}: {
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <AdminStatusBadge tone={isActive ? "success" : "neutral"}>
      {children}
    </AdminStatusBadge>
  );
}

import type {
  AdminCategory,
  AdminProductDetail,
} from "@/lib/admin/catalog";
import { AdminPanel } from "@/components/admin/tailadmin/primitives";
import { ProductFormDraft } from "@/app/admin/products/product-form-draft";

type ProductFormProps = {
  action: string;
  categories: AdminCategory[];
  product?: AdminProductDetail;
  error?: string;
  saved?: boolean;
  mode: "create" | "update";
};

export function ProductForm({
  action,
  categories,
  product,
  error,
  saved,
  mode,
}: ProductFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.58fr]">
      <form
        action={action}
        method="post"
        encType="multipart/form-data"
        data-product-form={mode}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-sm sm:p-6"
      >
        {mode === "create" ? <ProductFormDraft restore={Boolean(error)} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Product details" : "Edit product"}
          </h2>
          <StatusMessages error={error} saved={saved} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Product title" name="title" defaultValue={product?.title} />
          <Field label="SKU" name="sku" defaultValue={product?.sku} />
          <Field label="Slug" name="slug" defaultValue={product?.slug} />
          <Field
            label="Badge"
            name="badge"
            defaultValue={product?.badge}
            placeholder="New, Best seller"
          />
          <Field
            label="Price (SAR)"
            name="price"
            inputMode="decimal"
            defaultValue={formatHalalasInput(product?.priceHalalas)}
          />
          <Field
            label="Compare-at price (SAR)"
            name="compareAtPrice"
            inputMode="decimal"
            defaultValue={formatHalalasInput(product?.compareAtPriceHalalas)}
          />
          <Field
            label="VAT rate (basis points)"
            name="vatRateBps"
            type="number"
            defaultValue={String(product?.vatRateBps ?? 1500)}
          />
          <Field
            label="Low stock threshold"
            name="lowStockThreshold"
            type="number"
            defaultValue={String(product?.lowStockThreshold ?? 5)}
          />
          {mode === "create" ? (
            <Field
              label="Initial stock on hand"
              name="initialStockOnHand"
              type="number"
              defaultValue="0"
            />
          ) : null}
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Category
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            >
              <option value="">Unassigned</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={product?.description}
              className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-200 pt-5">
          <Checkbox
            name="isActive"
            label="Active on storefront"
            defaultChecked={product?.isActive ?? true}
          />
          <Checkbox
            name="isFeatured"
            label="Featured product"
            defaultChecked={product?.isFeatured ?? false}
          />
        </div>

        <div className="mt-7 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Product images</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload JPEG, PNG, WebP, or AVIF files up to 5 MB. The first
            completed image becomes primary unless another option is selected.
          </p>
          <div className="mt-5 grid gap-4">
            {Array.from({ length: 4 }, (_, index) => {
              const image = product?.images[index];

              return (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[1fr_1fr_auto]"
                >
                  <ImageFileField index={index} image={image} />
                  <Field
                    label="Alt text"
                    name={`imageAlt${index}`}
                    defaultValue={image?.alt}
                  />
                  <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="primaryImage"
                      value={String(index)}
                      defaultChecked={
                        image?.isPrimary ?? (!product?.images.length && index === 0)
                      }
                      className="size-4 accent-brand-500"
                    />
                    Primary
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="mt-7 h-12 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          {mode === "create" ? "Create product" : "Save product"}
        </button>
      </form>

      <aside className="space-y-6">
        {product ? (
          <AdminPanel className="p-5">
            <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Detail label="Stock on hand" value={String(product.stockOnHand)} />
              <Detail
                label="Reserved quantity"
                value={String(product.reservedQuantity)}
              />
            </dl>
            <form
              action={`/api/admin/products/${product.id}/inventory`}
              method="post"
              className="mt-5 grid gap-4 border-t border-gray-200 pt-5"
            >
              <Field
                label="Target stock on hand"
                name="targetStockOnHand"
                type="number"
                defaultValue={String(product.stockOnHand)}
              />
              <Field
                label="Adjustment reason"
                name="reason"
                defaultValue="Admin catalog stock adjustment"
              />
              <button
                type="submit"
                className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Adjust stock
              </button>
            </form>
          </AdminPanel>
        ) : null}

        <AdminPanel className="p-5">
          <h2 className="text-lg font-semibold text-gray-900">Catalog rules</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-500">
            <li>Prices are SAR amounts and are stored as integer halalas.</li>
            <li>Checkout totals are recalculated server-side.</li>
            <li>Inventory edits create explicit adjustment movements.</li>
            <li>Inactive products are hidden from public browsing.</li>
          </ul>
        </AdminPanel>
      </aside>
    </div>
  );
}

function ImageFileField({
  index,
  image,
}: {
  index: number;
  image?: AdminProductDetail["images"][number];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-gray-700">
      {`Image ${index + 1} file`}
      <input
        type="hidden"
        name={`existingImageUrl${index}`}
        value={image?.url ?? ""}
      />
      <input
        type="file"
        name={`imageFile${index}`}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="block min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-800 hover:file:bg-gray-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10"
      />
      {image ? (
        <span className="text-xs font-medium text-gray-500">
          Current image will be kept unless a new file is selected.
        </span>
      ) : null}
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        name={name}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
      />
    </label>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-brand-500"
      />
      {label}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
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

function formatHalalasInput(value: number | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const riyals = Math.trunc(value / 100);
  const halalas = value % 100;

  return halalas > 0
    ? `${riyals}.${halalas.toString().padStart(2, "0")}`
    : String(riyals);
}

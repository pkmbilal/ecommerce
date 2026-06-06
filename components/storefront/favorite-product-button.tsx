import { Heart } from "lucide-react";

type FavoriteProductButtonProps = {
  productSlug: string;
  isFavorite?: boolean;
  returnTo: string;
  compact?: boolean;
};

export function FavoriteProductButton({
  productSlug,
  isFavorite = false,
  returnTo,
  compact = false,
}: FavoriteProductButtonProps) {
  return (
    <form action="/api/account/favorites" method="post">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        className={`inline-flex items-center justify-center gap-2 rounded-full border font-bold transition ${
          isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950"
        } ${compact ? "size-10" : "h-12 px-5 text-sm"}`}
      >
        <Heart
          aria-hidden="true"
          className={`size-5 ${isFavorite ? "fill-current" : ""}`}
        />
        {compact ? null : isFavorite ? "Saved" : "Save favorite"}
      </button>
    </form>
  );
}

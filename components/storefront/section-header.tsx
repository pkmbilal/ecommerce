import Link from "next/link";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  href?: string;
};

export function SectionHeader({ kicker, title, href }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="editorial-kicker">{kicker}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white sm:inline"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}

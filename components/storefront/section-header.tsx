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
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          {kicker}
        </p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden text-sm font-bold text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-emerald-700 sm:inline"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}

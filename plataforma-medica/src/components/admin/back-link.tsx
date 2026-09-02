import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
      <ChevronLeftIcon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

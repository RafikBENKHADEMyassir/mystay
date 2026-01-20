import Link from "next/link";
import { ChevronLeft, Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

type TopbarProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  leading?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function Topbar({ title, subtitle, backHref, leading, right, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/60 bg-gradient-to-b from-background/0 via-background/80 to-background backdrop-blur",
        className
      )}
    >
      <div className="mx-auto grid max-w-md grid-cols-[auto,1fr,auto] items-start gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        {backHref ? (
          <Link
            href={backHref}
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-muted/20"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="h-10 w-10" />
        )}

        <div className={cn("min-w-0", leading ? "flex items-center gap-3" : "")}>
          {leading ? <div className="mt-0.5 shrink-0">{leading}</div> : null}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-none text-foreground">{title}</p>
            {subtitle ? <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center text-foreground">
          {right ?? <Leaf className="h-5 w-5" />}
        </div>
      </div>
    </header>
  );
}

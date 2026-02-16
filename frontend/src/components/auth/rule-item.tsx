import { cn } from "@/lib/utils";

export function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
          ok ? "border-emerald-500 text-emerald-600" : "border-muted-foreground/40 text-muted-foreground/60"
        )}
        aria-hidden="true"
      >
        {ok ? "✓" : "○"}
      </span>
      <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}

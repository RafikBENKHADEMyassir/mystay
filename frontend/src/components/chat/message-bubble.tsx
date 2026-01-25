"use client";

import { Check, CheckCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  variant: "incoming" | "outgoing" | "error";
  body: string;
  timestamp?: string;
  showTranslate?: boolean;
  compact?: boolean;
};

export function MessageBubble({ variant, body, timestamp, showTranslate, compact }: MessageBubbleProps) {
  const isOutgoing = variant === "outgoing";
  const isError = variant === "error";

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl shadow-sm",
          compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-[15px] leading-relaxed",
          isOutgoing && "bg-zinc-700 text-white",
          variant === "incoming" && "bg-white text-foreground",
          isError && "bg-white text-destructive ring-1 ring-destructive/30"
        )}
      >
        <p className="whitespace-pre-wrap">{body}</p>

        {isError ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-destructive">
            <TriangleAlert className="h-4 w-4" />
            <span>Erreur lors de l&apos;envoi. Appuyez pour réessayer.</span>
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-end gap-2">
          {showTranslate ? <button className="text-xs text-muted-foreground underline">Traduire</button> : null}
          {timestamp ? <span className={cn("text-xs", isOutgoing ? "text-white/70" : "text-muted-foreground")}>{timestamp}</span> : null}
          {isOutgoing ? (
            <span className="inline-flex items-center gap-1 text-white/70">
              <Check className="h-3 w-3" />
              <CheckCheck className="h-3 w-3 opacity-70" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { PlusSquare, Send, Zap } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

type Attachment = {
  id: string;
  label: string;
};

type MessageComposerLabels = {
  removeAttachmentAria: string;
  addAttachmentAria: string;
  quickActionAria: string;
  sendAria: string;
  writePlaceholder: string;
};

type MessageComposerProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachments?: Attachment[];
  onRemoveAttachment?: (attachmentId: string) => void;
  onAddAttachment?: () => void;
  placeholder?: string;
  labels?: MessageComposerLabels;
};

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  attachments,
  onRemoveAttachment,
  onAddAttachment,
  placeholder,
  labels
}: MessageComposerProps) {
  const canSend = Boolean(value.trim()) && !disabled;
  const shownAttachments = useMemo(() => attachments?.slice(0, 2) ?? [], [attachments]);

  return (
    <div className="space-y-3 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
      {shownAttachments.length ? (
        <div className="flex gap-3">
          {shownAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-12 w-12 rounded-2xl bg-muted/50 ring-1 ring-border shadow-sm"
            >
              {onRemoveAttachment ? (
                <button
                  type="button"
                  className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  aria-label={labels?.removeAttachmentAria ?? ""}
                >
                  ×
                </button>
              ) : null}
              <span className="sr-only">{attachment.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-background text-foreground shadow-sm", disabled && "opacity-60")}
          disabled={disabled}
          aria-label={labels?.addAttachmentAria ?? ""}
          onClick={onAddAttachment}
        >
          <PlusSquare className="h-6 w-6" />
        </button>

        <button
          type="button"
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-sm",
            disabled && "opacity-60"
          )}
          disabled={disabled}
          aria-label={labels?.quickActionAria ?? ""}
        >
          <Zap className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-full border bg-background px-4 py-2 shadow-sm">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder ?? labels?.writePlaceholder ?? ""}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={disabled}
            />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition",
            !canSend && "bg-muted text-muted-foreground"
          )}
          aria-label={labels?.sendAria ?? ""}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

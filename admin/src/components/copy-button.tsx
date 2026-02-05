"use client";

import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";

type CopyButtonProps = ButtonProps & {
  value: string;
  successMessage?: string;
};

export function CopyButton({ value, successMessage = "Copied", ...props }: CopyButtonProps) {
  return (
    <Button
      type="button"
      {...props}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(successMessage);
        } catch {
          toast.error("Unable to copy");
        }
      }}
    />
  );
}


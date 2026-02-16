"use client";

import NextLink from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Shared visual variants used by both AppLink and AppButton */
export const appButtonVariants = {
  primary:
    "flex h-[50px] w-full items-center justify-center rounded-[6px] bg-black text-[17px] font-semibold text-white active:scale-[0.99]",
  secondary:
    "flex h-[50px] w-full items-center justify-center rounded-[6px] border border-[#E5E5EA] bg-white text-[17px] font-semibold text-black active:scale-[0.99]",
} as const;

export type AppButtonVariant = keyof typeof appButtonVariants;

/* ─── AppLink (anchor / Next.js Link) ─── */

export type AppLinkProps = ComponentProps<typeof NextLink> & {
  variant?: AppButtonVariant;
};

export function AppLink({ className, variant, ...props }: AppLinkProps) {
  return (
    <NextLink
      className={cn(variant && appButtonVariants[variant], className)}
      {...props}
    />
  );
}

/* ─── AppButton (native button) ─── */

export type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
};

export function AppButton({ className, variant = "primary", type = "button", ...props }: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(appButtonVariants[variant], className)}
      {...props}
    />
  );
}

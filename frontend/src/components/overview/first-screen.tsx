"use client";

import { AppLink } from "@/components/ui/app-link";
import type { GuestContent } from "@/lib/guest-content";
import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

type Props = {
  locale: Locale;
  content: GuestContent["pages"]["home"]["firstScreen"];
};

export function FirstScreen({ locale, content }: Props) {
  return (
    <div className="flex min-h-screen flex-col justify-start bg-white px-5 pb-10 pt-16 font-sans">
      {/* Top section with title and description */}
      <div className="mt-8 space-y-4">
        <h1 className="text-[26px] font-medium leading-[1.2] tracking-[-0.01em] text-[#1a1a1a]">{content.title}</h1>
        <p className="whitespace-pre-line text-[15px] leading-[1.6] text-[#8a8a8a]">{content.subtitle}</p>
      </div>
      <div className="mt-8 space-y-4">
        <p></p>
      </div>
      {/* Bottom section with buttons */}
      <div className="mt-[10rem] w-full space-y-3">
        <p className="mb-1 text-center text-[14px] font-semibold text-black">{content.noAccount}</p>

        <AppLink href={withLocale(locale, "/signup")} variant="secondary">
          {content.setup}
        </AppLink>
        <div className="py-[1rem]">
        <hr className=" rounded-[9px]" style={{ border: "2px solid rgb(204 204 204 / 25%)" }}/>

        </div>
        <AppLink href={withLocale(locale, "/login")} variant="primary">
          {content.login}
        </AppLink>

      </div>
    </div>
  );
}

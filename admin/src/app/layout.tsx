import type { Metadata } from "next";
import "./globals.css";

import { Suspense } from "react";
import { cookies } from "next/headers";

import { adminLocaleCookieName, defaultAdminLocale, isAdminLocale } from "@/lib/admin-locale";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastQuery } from "@/components/toast-query";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MyStay Admin",
  description: "Staff and management dashboard for MyStay."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const localeFromCookie = cookies().get(adminLocaleCookieName)?.value;
  const htmlLang = isAdminLocale(localeFromCookie) ? localeFromCookie : defaultAdminLocale;

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Suspense fallback={null}>
            <ToastQuery />
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

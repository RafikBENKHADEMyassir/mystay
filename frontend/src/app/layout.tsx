import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyStay",
  description: "Guest and staff experience platform for hotels powered by MyStay."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}

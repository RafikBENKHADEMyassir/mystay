"use client";

import { AppLink } from "@/components/ui/app-link";
import { useEffect } from "react";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export default function AdminRedirectPage() {
  useEffect(() => {
    window.location.assign(adminUrl);
  }, []);

  return (
    <main className="mx-auto max-w-lg space-y-4 px-6 py-12 text-center">
      <AppLink href={adminUrl} className="text-sm font-semibold text-primary hover:underline">
        {adminUrl}
      </AppLink>
    </main>
  );
}

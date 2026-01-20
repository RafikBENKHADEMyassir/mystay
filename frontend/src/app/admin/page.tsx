"use client";

import Link from "next/link";
import { useEffect } from "react";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export default function AdminRedirectPage() {
  useEffect(() => {
    window.location.assign(adminUrl);
  }, []);

  return (
    <main className="mx-auto max-w-lg space-y-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Opening admin…</h1>
      <p className="text-sm text-muted-foreground">
        Admin runs as a separate app in dev. If you are not redirected automatically, open:
      </p>
      <Link href={adminUrl} className="text-sm font-semibold text-primary hover:underline">
        {adminUrl}
      </Link>
    </main>
  );
}


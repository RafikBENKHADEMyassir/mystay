import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BackupClient } from "./BackupClient";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Backup & Disaster Recovery</h1>
        <p className="text-muted-foreground">
          Database backups, retention policies, and recovery options.
        </p>
      </div>

      <BackupClient />
    </div>
  );
}

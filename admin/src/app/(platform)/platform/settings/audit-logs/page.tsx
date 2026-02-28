import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AuditLogsClient } from "./AuditLogsClient";

export default function AuditLogsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs & Compliance</h1>
        <p className="text-muted-foreground">
          Track admin actions, configuration changes, and ensure regulatory compliance.
        </p>
      </div>

      <AuditLogsClient />
    </div>
  );
}

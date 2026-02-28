import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NotificationsClient } from "./NotificationsClient";

export default function NotificationsSettingsPage({
  searchParams
}: {
  searchParams: { tab?: string };
}) {
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
        <h1 className="text-3xl font-bold tracking-tight">Notification Providers</h1>
        <p className="text-muted-foreground">
          Configure email, SMS, and push notification providers for each hotel.
        </p>
      </div>

      <NotificationsClient initialTab={searchParams.tab} />
    </div>
  );
}

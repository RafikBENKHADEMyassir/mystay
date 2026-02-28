import Link from "next/link";
import { Settings, Database, Shield, Bell, Mail, MessageSquare, Gauge, FileCheck, HardDrive } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const settingsPages = [
  {
    title: "Email Provider",
    description: "Configure SendGrid, Mailgun, SES for transactional emails.",
    href: "/platform/settings/notifications?tab=email",
    icon: Mail
  },
  {
    title: "SMS Provider",
    description: "Configure Twilio, MessageBird for SMS notifications.",
    href: "/platform/settings/notifications?tab=sms",
    icon: MessageSquare
  },
  {
    title: "Push Notifications",
    description: "Set up Firebase Cloud Messaging or OneSignal.",
    href: "/platform/settings/notifications?tab=push",
    icon: Bell
  },
  {
    title: "Rate Limiting & Quotas",
    description: "API rate limits, login throttling, and upload quotas.",
    href: "/platform/settings/rate-limits",
    icon: Gauge
  },
  {
    title: "Audit Logs & Compliance",
    description: "View admin actions, track changes, and ensure compliance.",
    href: "/platform/settings/audit-logs",
    icon: FileCheck
  },
  {
    title: "Backup & Disaster Recovery",
    description: "Database backups, retention policies, and recovery options.",
    href: "/platform/settings/backup",
    icon: HardDrive
  }
];

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global platform settings and integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Current system health and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backend API</span>
              <Badge variant="default">Running</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Environment</span>
              <Badge variant="secondary">
                {process.env.NODE_ENV === "production" ? "Production" : "Development"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Authentication and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">JWT Tokens</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Password Hashing</span>
              <Badge variant="default">bcrypt</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CORS</span>
              <Badge variant="secondary">Configured</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>Backend API settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backend URL</span>
              <code className="text-xs text-muted-foreground">
                {process.env.BACKEND_URL ?? "localhost:4000"}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Version</span>
              <Badge variant="secondary">v1</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsPages.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <page.icon className="h-5 w-5" />
                    {page.title}
                  </CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

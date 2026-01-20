import { Settings, Database, Shield, Bell } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
              <Badge variant="secondary">Development</Badge>
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
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Platform-wide notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email Provider</span>
              <Badge variant="outline">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SMS Provider</span>
              <Badge variant="outline">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Push Notifications</span>
              <Badge variant="outline">Not configured</Badge>
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
              <code className="text-xs text-muted-foreground">localhost:4000</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Version</span>
              <Badge variant="secondary">v1</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Coming Soon</CardTitle>
          <CardDescription>Future settings and configurations</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Email provider configuration (SendGrid, SES, etc.)</li>
            <li>SMS provider configuration (Twilio, etc.)</li>
            <li>Push notification setup (FCM, APNs)</li>
            <li>Rate limiting and quotas</li>
            <li>Audit logs and compliance</li>
            <li>Backup and disaster recovery</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

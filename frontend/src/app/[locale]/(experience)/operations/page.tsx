import { ClipboardList, PanelsTopLeft, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations"
        description="Staff consoles per department with routing, permissions, and audit trails."
        actions={
          <>
            <Button variant="outline" size="sm">
              Configure roles
            </Button>
            <Button size="sm">Create workflow</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4 text-primary" />
              <CardTitle>Department consoles</CardTitle>
              <Badge variant="secondary">Staff</Badge>
            </div>
            <CardDescription>Concierge, reception, housekeeping, spa, and F&B views.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Role-based access with department-scoped visibility by default.</li>
              <li>Task assignment, status updates, and SLA tracking for each request.</li>
              <li>Internal notes and tags for escalations across teams.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Governance</CardTitle>
            <CardDescription>Security, payments, and data protection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Compliance</span>
            </div>
            <p>Audit logs for ID capture, payments, and consent; strict separation of duties.</p>
            <div className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>Workflows</span>
            </div>
            <p>Reusable workflows for check-in, escalations, maintenance, and service recovery.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

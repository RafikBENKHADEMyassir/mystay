"use client";

import { ClipboardList, PanelsTopLeft, ShieldCheck } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { useGuestContent } from "@/lib/hooks/use-guest-content";

export default function OperationsPage() {
  const locale = useLocale();
  const { content } = useGuestContent(locale, getDemoSession()?.hotelId ?? null);
  const page = content?.pages.operations;

  if (!page) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <>
            <Button variant="outline" size="sm">
              {page.configureRoles}
            </Button>
            <Button size="sm">{page.createWorkflow}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4 text-primary" />
              <CardTitle>{page.departmentConsolesTitle}</CardTitle>
              <Badge variant="secondary">{page.departmentConsolesBadge}</Badge>
            </div>
            <CardDescription>{page.departmentConsolesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              {page.departmentBullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{page.governanceTitle}</CardTitle>
            <CardDescription>{page.governanceDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>{page.complianceTitle}</span>
            </div>
            <p>{page.complianceText}</p>
            <div className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>{page.workflowsTitle}</span>
            </div>
            <p>{page.workflowsText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

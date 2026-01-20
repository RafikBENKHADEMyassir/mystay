import { CheckCircle2, MessageCircle, ScrollText, Timer } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const summary = [
  {
    title: "Digital check-in",
    value: "Ready",
    description: "Capture ID, signatures, deposits, and activate keys.",
    icon: CheckCircle2,
    badge: "PMS sync"
  },
  {
    title: "Agenda",
    value: "Live",
    description: "Bookings aggregate from spa, dining, transport, and tasks.",
    icon: Timer,
    badge: "Real time"
  },
  {
    title: "Messaging",
    value: "Threaded",
    description: "One inbox for concierge, reception, housekeeping, and F&B.",
    icon: MessageCircle,
    badge: "Cross-team"
  },
  {
    title: "Compliance",
    value: "In-scope",
    description: "Payments, document capture, and consent with audit trails.",
    icon: ScrollText,
    badge: "Security"
  }
];

export function SummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summary.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="h-full">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant="outline">{item.badge}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{item.value}</span>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

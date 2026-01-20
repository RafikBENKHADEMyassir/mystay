import { CalendarClock, Dumbbell, HeartPulse, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SpaGymPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Spa & Gym"
        description="Catalog of services with live availability, confirmations, and feedback capture."
        actions={<Button size="sm">Add service</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <CardTitle>Guest booking</CardTitle>
              <Badge variant="secondary">Slots</Badge>
            </div>
            <CardDescription>Pick time, practitioner, and add special requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Real-time slot selection synced to the PMS/Spa Booker system.</li>
              <li>Confirmation, reminders, and cancellations with fee handling.</li>
              <li>Post-service rating with optional tip routing to practitioners.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>Capacity planning and staff scheduling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>Calendars</span>
            </div>
            <p>Calendars by practitioner, room, and service type with conflict checks.</p>
            <div className="flex items-center gap-2 text-foreground">
              <HeartPulse className="h-4 w-4" />
              <span>Wellness add-ons</span>
            </div>
            <p>Pre/post upsell suggestions (sauna, massage upgrades, training sessions).</p>
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Feedback loop</span>
            </div>
            <p>Capture NPS per service and push follow-ups to loyalty programs.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

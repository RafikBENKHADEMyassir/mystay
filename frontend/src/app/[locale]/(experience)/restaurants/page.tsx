import { Clock3, MapPin, Star, Utensils } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RestaurantsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Restaurants"
        description="Menu exploration with allergens, table booking, and chat with the restaurant."
        actions={<Button size="sm">New reservation</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <CardTitle>Dining journey</CardTitle>
              <Badge variant="secondary">Bookings</Badge>
            </div>
            <CardDescription>Menus with photos, allergens, and filters by course or diet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Table reservations with party size, special requests, and confirmations.</li>
              <li>Chat for adjustments, pre-orders, or dietary questions.</li>
              <li>Agenda integration so guests see their dining times alongside other bookings.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>Front-of-house overview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4" />
              <span>Seating</span>
            </div>
            <p>Seat maps and pacing controls to balance the kitchen.</p>
            <div className="flex items-center gap-2 text-foreground">
              <Clock3 className="h-4 w-4" />
              <span>Waitlist</span>
            </div>
            <p>Manage waitlists and send automated updates to guests.</p>
            <div className="flex items-center gap-2 text-foreground">
              <Star className="h-4 w-4" />
              <span>Feedback</span>
            </div>
            <p>Collect post-meal ratings and push comps or follow-ups for recovery.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

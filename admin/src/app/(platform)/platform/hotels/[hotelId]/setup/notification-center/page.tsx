import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationCenterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification center</CardTitle>
        <CardDescription>Configure email/SMS/push notifications and delivery providers.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: provider keys (Sendgrid/Twilio/FCM) and per-message toggles.
      </CardContent>
    </Card>
  );
}


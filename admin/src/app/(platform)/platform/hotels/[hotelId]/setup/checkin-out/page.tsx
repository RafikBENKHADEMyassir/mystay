import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckinOutSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-in/out config</CardTitle>
        <CardDescription>Configure digital check-in/out requirements and flows.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: ID verification requirements, payment holds, and e-signature settings.
      </CardContent>
    </Card>
  );
}


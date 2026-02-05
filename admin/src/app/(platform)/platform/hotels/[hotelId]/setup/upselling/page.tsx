import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpsellingSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upselling</CardTitle>
        <CardDescription>Configure upsells and touchpoints across the stay.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: service catalog sync, weekday availability, and pricing rules.
      </CardContent>
    </Card>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoomServiceSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room service</CardTitle>
        <CardDescription>Configure ordering hours, categories, and operational rules.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: open hours, menu sources, and fulfillment SLAs.
      </CardContent>
    </Card>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HotelRulesSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel rules</CardTitle>
        <CardDescription>Configure policies shown to guests during the journey.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: quiet hours, smoking policies, and multi-language copy.
      </CardContent>
    </Card>
  );
}


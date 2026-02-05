import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MinibarSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minibar</CardTitle>
        <CardDescription>Configure minibar catalog and posting rules.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: item catalog, room presets, and PMS posting mapping.
      </CardContent>
    </Card>
  );
}


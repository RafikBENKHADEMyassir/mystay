import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MenuSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu setup</CardTitle>
        <CardDescription>Configure guest-facing menus and ordering modules.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This section will host menu builders for room service, restaurants, and minibar.
      </CardContent>
    </Card>
  );
}


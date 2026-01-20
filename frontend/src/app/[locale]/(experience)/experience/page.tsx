// frontend/src/app/[locale]/(experience)/experience/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Wifi, Map, Clock } from "lucide-react";

export default function ExperiencePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Room card with image */}
      <Card>
        <div className="aspect-video w-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <p className="text-gray-500">Room Image Placeholder</p>
        </div>
        <CardHeader>
          <CardTitle>Suite 204 - Deluxe Ocean View</CardTitle>
          <CardDescription>
            Check-in: Jan 11, 2026 | Check-out: Jan 14, 2026
            <br />
            2 Adults
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Key className="h-6 w-6" />
          <span className="text-sm">Digital Key</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Wifi className="h-6 w-6" />
          <span className="text-sm">Wi-Fi</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Map className="h-6 w-6" />
          <span className="text-sm">Hotel Map</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Clock className="h-6 w-6" />
          <span className="text-sm">Early Check-in</span>
        </Button>
      </div>

      {/* Welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to MyStay!</CardTitle>
          <CardDescription>
            We&apos;re delighted to have you. Explore all the services available during your stay.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

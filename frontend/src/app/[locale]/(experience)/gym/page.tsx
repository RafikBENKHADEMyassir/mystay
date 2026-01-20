// frontend/src/app/[locale]/(experience)/gym/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Dumbbell } from "lucide-react";

const fitnessClasses = [
  {
    id: "1",
    name: "Morning Yoga",
    time: "7:00 AM",
    duration: "60 min",
    instructor: "Sarah Chen",
    spots: 5,
  },
  {
    id: "2",
    name: "HIIT Training",
    time: "6:00 PM",
    duration: "45 min",
    instructor: "Mike Johnson",
    spots: 3,
  },
  {
    id: "3",
    name: "Pilates",
    time: "9:00 AM",
    duration: "50 min",
    instructor: "Emma Wilson",
    spots: 8,
  },
];

export default function GymPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8" />
            <div>
              <CardTitle>Gym & Fitness</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                Open 24/7
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Access Gym Now</Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Classes</h2>
        <div className="grid gap-4">
          {fitnessClasses.map((fitnessClass) => (
            <Card key={fitnessClass.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{fitnessClass.name}</CardTitle>
                    <CardDescription className="mt-1">
                      with {fitnessClass.instructor}
                    </CardDescription>
                  </div>
                  <Badge variant={fitnessClass.spots < 5 ? "destructive" : "secondary"}>
                    {fitnessClass.spots} spots left
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span>{fitnessClass.time}</span>
                  <span>•</span>
                  <span>{fitnessClass.duration}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Reserve Spot</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Training</CardTitle>
          <CardDescription>
            Book a one-on-one session with our certified trainers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            Book Personal Trainer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

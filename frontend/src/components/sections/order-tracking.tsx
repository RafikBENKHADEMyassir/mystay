"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getOrderTrackingStrings } from "@/lib/i18n/order-tracking";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "preparing" | "delivering" | "completed" | "cancelled";

type OrderTrackingProps = {
  orderId: string;
  initialStatus?: OrderStatus;
  onStatusChange?: (status: OrderStatus) => void;
};

const statusOrder: OrderStatus[] = ["pending", "preparing", "delivering", "completed"];

export function OrderTracking({ orderId, initialStatus = "pending", onStatusChange }: OrderTrackingProps) {
  const locale = useLocale();
  const t = getOrderTrackingStrings(locale);
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [isConnected, setIsConnected] = useState(false);
  
  const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string }> = {
    pending: {
      icon: <Clock className="h-5 w-5" />,
      color: "text-yellow-600"
    },
    preparing: {
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-600"
    },
    delivering: {
      icon: <Truck className="h-5 w-5" />,
      color: "text-purple-600"
    },
    completed: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-600"
    },
    cancelled: {
      icon: <Clock className="h-5 w-5" />,
      color: "text-red-600"
    }
  };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = localStorage.getItem("guestToken");
    
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    const eventSource = new EventSource(
      `${apiUrl}/api/v1/realtime/orders?ticketId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      // Order tracking connected
    };

    eventSource.addEventListener("ticket_updated", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.ticketId === orderId && data.status) {
          setStatus(data.status as OrderStatus);
          setLastUpdate(new Date().toISOString());
          onStatusChange?.(data.status);
        }
      } catch (error) {
        console.error("Failed to parse order update:", error);
      }
    });

    eventSource.addEventListener("ping", () => {
      // Keep connection alive
    });

    eventSource.onerror = (error) => {
      console.error("Order tracking connection error:", error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [orderId, onStatusChange]);

  const currentStepIndex = statusOrder.indexOf(status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.title}</CardTitle>
          {isConnected && (
            <Badge variant="outline" className="text-xs">
              <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {t.live}
            </Badge>
          )}
        </div>
        <CardDescription>{t.orderId} {orderId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusOrder.map((statusKey, index) => {
            const config = statusConfig[statusKey];
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isCurrent = statusKey === status;

            return (
              <div key={statusKey} className="flex items-start gap-4">
                {/* Status indicator */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted || isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/20 bg-muted text-muted-foreground"
                  )}
                >
                  {config.icon}
                </div>

                {/* Status info */}
                <div className="flex-1 space-y-1">
                  <p
                    className={cn(
                      "font-medium",
                      isCurrent ? config.color : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {t.statuses[statusKey]}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground">
                      {t.updated} {new Date(lastUpdate).toLocaleTimeString()}
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-muted-foreground">{t.statusCompleted}</p>
                  )}
                </div>

                {/* Connector line */}
                {index < statusOrder.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[1.25rem] mt-12 h-8 w-0.5",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {status === "cancelled" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {t.cancelledMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

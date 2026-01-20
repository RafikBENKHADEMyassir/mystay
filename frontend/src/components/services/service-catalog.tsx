"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  Shirt, 
  UtensilsCrossed, 
  Sun, 
  GlassWater, 
  Wine,
  Bed, 
  DoorOpen, 
  Flower2, 
  Dumbbell,
  Car,
  Gift,
  Calendar,
  Loader2,
  MessageCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceItem } from "./service-request-form";
import { ServiceRequestDialog } from "./service-request-dialog";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ServiceCategory = {
  id: string;
  hotelId: string;
  department: string;
  nameKey: string;
  nameDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
  icon: string;
  sortOrder: number;
};

type ServiceCatalogProps = {
  hotelId: string;
  department: string;
  guestToken: string;
  stayId: string;
  roomNumber: string | null;
  onRequestSubmitted?: (ticketId: string) => void;
};

// Icon mapping for service items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  shirt: Shirt,
  utensils: UtensilsCrossed,
  sun: Sun,
  glass: GlassWater,
  wine: Wine,
  bed: Bed,
  door: DoorOpen,
  spa: Flower2,
  smile: Flower2,
  dumbbell: Dumbbell,
  car: Car,
  gift: Gift,
  calendar: Calendar,
  towel: Sparkles,
  pillow: Bed,
  blanket: Bed,
  soap: Sparkles,
  broom: Sparkles,
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return iconMap[iconName] || Sparkles;
}

export function ServiceCatalog({
  hotelId,
  department,
  guestToken,
  stayId,
  roomNumber,
  onRequestSubmitted
}: ServiceCatalogProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load categories for this department
      const categoriesUrl = new URL("/api/v1/services/categories", apiBaseUrl);
      categoriesUrl.searchParams.set("hotelId", hotelId);
      categoriesUrl.searchParams.set("department", department);

      const categoriesRes = await fetch(categoriesUrl.toString(), {
        headers: { Authorization: `Bearer ${guestToken}` }
      });

      if (!categoriesRes.ok) {
        throw new Error("Failed to load service categories");
      }

      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData.categories || []);

      // Load items for this department
      const itemsUrl = new URL("/api/v1/services/items", apiBaseUrl);
      itemsUrl.searchParams.set("hotelId", hotelId);
      itemsUrl.searchParams.set("department", department);

      const itemsRes = await fetch(itemsUrl.toString(), {
        headers: { Authorization: `Bearer ${guestToken}` }
      });

      if (!itemsRes.ok) {
        throw new Error("Failed to load service items");
      }

      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setIsLoading(false);
    }
  }, [hotelId, department, guestToken]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleItemClick = (item: ServiceItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedItem(null), 300); // Clear after animation
  };

  const handleSubmit = async (
    serviceItem: ServiceItem,
    formData: Record<string, unknown>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> => {
    if (!roomNumber) {
      return { success: false, error: "Room number is required to submit requests" };
    }

    try {
      const response = await fetch(new URL("/api/v1/tickets", apiBaseUrl).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`
        },
        body: JSON.stringify({
          hotelId,
          stayId,
          roomNumber,
          department: serviceItem.department,
          serviceItemId: serviceItem.id,
          title: serviceItem.nameDefault,
          payload: {
            type: "service_request",
            serviceItemId: serviceItem.id,
            serviceItemName: serviceItem.nameDefault,
            formData
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || "Failed to submit request" 
        };
      }

      const result = await response.json();
      
      if (onRequestSubmitted && result.id) {
        onRequestSubmitted(result.id);
      }

      return { success: true, ticketId: result.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Network error" 
      };
    }
  };

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = [];
    }
    acc[item.categoryId].push(item);
    return acc;
  }, {} as Record<string, ServiceItem[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadCatalog}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No services available for this department at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = itemsByCategory[category.id] || [];
          const CategoryIcon = getIcon(category.icon);

          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{category.nameDefault}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {categoryItems.length} services
                </Badge>
              </div>
              
              {category.descriptionDefault && (
                <p className="text-sm text-muted-foreground">
                  {category.descriptionDefault}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {categoryItems.map((item) => {
                  const ItemIcon = getIcon(item.icon);
                  
                  return (
                    <Card
                      key={item.id}
                      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ItemIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium leading-tight">{item.nameDefault}</h4>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {item.descriptionDefault}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {item.estimatedTimeMinutes && (
                              <Badge variant="outline" className="text-xs">
                                ~{item.estimatedTimeMinutes} min
                              </Badge>
                            )}
                            {item.priceCents !== null && item.priceCents > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {(item.priceCents / 100).toFixed(2)} {item.currency}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Free-form message option */}
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Need something else?</h4>
              <p className="text-xs text-muted-foreground">
                Send a free-form message to our staff
              </p>
            </div>
            <Button variant="outline" size="sm">
              Message
            </Button>
          </CardContent>
        </Card>
      </div>

      <ServiceRequestDialog
        serviceItem={selectedItem}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
      />
    </>
  );
}

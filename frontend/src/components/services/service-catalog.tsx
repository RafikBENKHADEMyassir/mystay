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
  MessageCircle,
  ChevronRight,
  Plane,
  Ticket,
  MapPin,
  Coffee,
  Croissant,
  Clock,
  Trash2,
  Moon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
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

// Icon mapping for service items - matching the design aesthetic
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
  plane: Plane,
  ticket: Ticket,
  map: MapPin,
  coffee: Coffee,
  croissant: Croissant,
  clock: Clock,
  trash: Trash2,
  moon: Moon,
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
  const locale = useLocale();
  const { content } = useGuestContent(locale, hotelId);
  const serviceStrings = content?.pages.services;
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (!serviceStrings) return;
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
        throw new Error("could_not_load_categories");
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
        throw new Error("could_not_load_items");
      }

      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "could_not_load_categories") {
        setError(serviceStrings.catalog.couldNotLoadCategories);
      } else if (code === "could_not_load_items") {
        setError(serviceStrings.catalog.couldNotLoadItems);
      } else {
        setError(serviceStrings.catalog.fallbackLoadError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hotelId, department, guestToken, serviceStrings]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleItemClick = (item: ServiceItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleSubmit = async (
    serviceItem: ServiceItem,
    formData: Record<string, unknown>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> => {
    if (!serviceStrings) {
      return { success: false };
    }
    if (!roomNumber) {
      return { success: false, error: serviceStrings.catalog.roomNumberRequired };
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
          error: typeof errorData.error === "string" ? errorData.error : serviceStrings.catalog.submitFailed
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
        error: err instanceof Error && err.message ? err.message : serviceStrings.catalog.networkError
      };
    }
  };

  if (!serviceStrings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

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
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadCatalog}>
            {serviceStrings.catalog.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">
          {serviceStrings.catalog.noServicesAvailable}
        </p>
      </div>
    );
  }

  // Flat list view matching the design
  const showCategories = categories.length > 1;

  return (
    <>
      <div className="divide-y divide-gray-100">
        {showCategories ? (
          // Show with category headers if multiple categories
          categories.map((category) => {
            const categoryItems = itemsByCategory[category.id] || [];
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} className="py-4 first:pt-0 last:pb-0">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  {category.nameDefault}
                </p>
                <div className="space-y-1">
                  {categoryItems.map((item) => (
                    <ServiceListItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Flat list without category headers
          <div className="space-y-1">
            {items.map((item) => (
              <ServiceListItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                locale={locale}
              />
            ))}
          </div>
        )}

        {/* Free-form message option */}
        <div className="pt-4">
          <button
            className="flex w-full items-center gap-4 rounded-xl bg-gray-50 px-4 py-4 text-left transition-colors hover:bg-gray-100"
            onClick={() => {/* TODO: Open messaging */}}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <MessageCircle className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{serviceStrings.catalog.otherRequestTitle}</p>
              <p className="text-sm text-gray-500">
                {serviceStrings.catalog.otherRequestDescription}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>

      <ServiceRequestDialog
        serviceItem={selectedItem}
        content={{
          requestDialog: serviceStrings.requestDialog,
          requestForm: serviceStrings.requestForm
        }}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
      />
    </>
  );
}

// Clean list item component matching the design
function ServiceListItem({ 
  item, 
  onClick,
  locale
}: { 
  item: ServiceItem; 
  onClick: () => void;
  locale: "en" | "fr" | "es";
}) {
  const ItemIcon = getIcon(item.icon);

  function formatMoney(amountCents: number, currency: string) {
    const languageTag = locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US";
    try {
      return new Intl.NumberFormat(languageTag, { style: "currency", currency }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  }
  
  return (
    <button
      className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <ItemIcon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{item.nameDefault}</p>
        {item.priceCents !== null && item.priceCents > 0 && (
          <p className="text-sm text-gray-500">
            {formatMoney(item.priceCents, item.currency)}
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
  );
}

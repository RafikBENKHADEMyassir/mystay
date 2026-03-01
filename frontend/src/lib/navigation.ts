import {
  BarChart3,
  Brush,
  CalendarRange,
  Dumbbell,
  LayoutDashboard,
  MessageCircle,
  Settings2,
  UserRound,
  Utensils,
  UtensilsCrossed,
  Wand
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap = {
  overview: LayoutDashboard,
  agenda: CalendarRange,
  concierge: Wand,
  housekeeping: Brush,
  "room-service": UtensilsCrossed,
  "spa-gym": Dumbbell,
  restaurants: Utensils,
  messages: MessageCircle,
  profile: UserRound,
  operations: Settings2,
  analytics: BarChart3
} as const;

export type IconName = keyof typeof iconMap;

export function navIcon(name: IconName): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

export type NavSection = "guest" | "operations";

export type NavItem = {
  title: string;
  href: string;
  icon: IconName;
  section: NavSection;
  badge?: string;
  description?: string;
};

export const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: "overview",
    section: "guest",
    description: "Stay summary, quick actions, and live status."
  },
  {
    title: "Services",
    href: "/services",
    icon: "concierge",
    section: "guest",
    description: "Browse hotel services and current requests."
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: "agenda",
    section: "guest",
    description: "Unified calendar for spa, dining, and activities."
  },
  {
    title: "Concierge",
    href: "/concierge",
    icon: "concierge",
    section: "guest",
    description: "Chat and quick actions for transport and bookings."
  },
  {
    title: "Housekeeping",
    href: "/housekeeping",
    icon: "housekeeping",
    section: "guest",
    description: "Service toggle, requests, and status tracking."
  },
  {
    title: "Room Service",
    href: "/room-service",
    icon: "room-service",
    section: "guest",
    description: "Order, pay, and follow delivery milestones."
  },
  {
    title: "Spa & Gym",
    href: "/spa-gym",
    icon: "spa-gym",
    section: "guest",
    description: "Catalog, slots, and confirmations."
  },
  {
    title: "Restaurants",
    href: "/restaurants",
    icon: "restaurants",
    section: "guest",
    description: "Menus, allergens, and table reservations."
  },
  {
    title: "Messages",
    href: "/messages",
    icon: "messages",
    section: "guest",
    description: "Threaded messaging across hotel departments."
  },
  {
    title: "Profile",
    href: "/profile",
    icon: "profile",
    section: "guest",
    description: "Identity, payments, and preferences."
  },
  {
    title: "Operations",
    href: "/operations",
    icon: "operations",
    section: "operations",
    description: "Staff consoles by department and workflows."
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "analytics",
    section: "operations",
    description: "KPIs and cross-department insights."
  }
];

export const guestNav = navItems.filter((item) => item.section === "guest");
export const operationsNav = navItems.filter((item) => item.section === "operations");

const guestBottomNavHrefs = ["/", "/services", "/messages", "/profile"] as const;

export const guestBottomNav: NavItem[] = guestBottomNavHrefs
  .map((href) => navItems.find((item) => item.section === "guest" && item.href === href))
  .filter((item): item is NavItem => Boolean(item));

export type FeatureTile = {
  title: string;
  description: string;
  href: string;
  tag?: string;
};

export const featureTiles: FeatureTile[] = [
  {
    title: "Digital Check-in",
    description: "Capture ID, signatures, and card holds; activate digital keys on approval.",
    href: "/",
    tag: "Reservations"
  },
  {
    title: "Agenda",
    description: "Real-time calendar that syncs spa, dining, transport, and housekeeping tasks.",
    href: "/agenda",
    tag: "Experience"
  },
  {
    title: "Concierge",
    description: "Chat with quick actions for taxis, restaurants, and tailored suggestions.",
    href: "/concierge",
    tag: "Guest Service"
  },
  {
    title: "Housekeeping",
    description: "Opt-in/out of cleaning, request supplies, and follow status updates.",
    href: "/housekeeping",
    tag: "Operations"
  },
  {
    title: "Room Service",
    description: "Menu browsing with filters, payments, and order tracking milestones.",
    href: "/room-service",
    tag: "F&B"
  },
  {
    title: "Spa & Gym",
    description: "Live slot selection, confirmations, and post-visit feedback or tips.",
    href: "/spa-gym",
    tag: "Wellness"
  },
  {
    title: "Restaurants",
    description: "Menus with allergens and instant table bookings with special requests.",
    href: "/restaurants",
    tag: "F&B"
  },
  {
    title: "Staff Consoles",
    description: "Department dashboards for concierge, housekeeping, spa, and F&B teams.",
    href: "/operations",
    tag: "Staff"
  },
  {
    title: "Analytics",
    description: "Cross-department KPIs, service SLAs, and satisfaction trends.",
    href: "/analytics",
    tag: "Management"
  }
];

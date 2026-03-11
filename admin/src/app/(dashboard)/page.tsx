import Link from "next/link";
import { cookies } from "next/headers";

import { requireStaffToken } from "@/lib/staff-auth";
import { adminLocaleCookieName, resolveAdminLocale } from "@/lib/admin-locale";
import { getStaffPrincipal } from "@/lib/staff-token";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "./DashboardStats";

type Tile = {
  key:
    | "inbox"
    | "reservations"
    | "payByLink"
    | "requests"
    | "integrations"
    | "reception"
    | "housekeeping"
    | "concierge";
  href: string;
  roles?: string[];
  departments?: string[];
};

const tiles: Tile[] = [
  {
    key: "inbox",
    href: "/inbox",
  },
  {
    key: "reservations",
    href: "/reservations",
    departments: ["reception"]
  },
  {
    key: "payByLink",
    href: "/payment-links",
    roles: ["admin", "manager"],
    departments: ["reception"]
  },
  {
    key: "requests",
    href: "/requests",
  },
  {
    key: "integrations",
    href: "/integrations",
    roles: ["admin", "manager"]
  },
  {
    key: "reception",
    href: "/inbox?dept=reception",
    departments: ["reception"]
  },
  {
    key: "housekeeping",
    href: "/housekeeping",
    departments: ["housekeeping"]
  },
  {
    key: "concierge",
    href: "/inbox?dept=concierge",
    departments: ["concierge"]
  }
];

const dashboardCopy = {
  en: {
    brand: "MyStay",
    title: "Dashboard",
    subtitle: "Hotel performance at a glance. Metrics update in real time.",
    tiles: {
      inbox: {
        title: "Inbox",
        description: "Unified guest conversations, with live updates.",
      },
      reservations: {
        title: "Reservations",
        description: "Arrivals, in-house stays, and check-outs.",
      },
      payByLink: {
        title: "Pay by link",
        description: "Create payment links for deposits and extras.",
      },
      requests: {
        title: "Requests",
        description: "Structured service requests and handover notes.",
      },
      integrations: {
        title: "Integrations",
        description: "Configure PMS, digital keys, and per-hotel providers.",
      },
      reception: {
        title: "Reception",
        description: "Arrivals/departures, check-in validation, check-out and keys.",
      },
      housekeeping: {
        title: "Housekeeping",
        description: "Room status board and task assignments.",
      },
      concierge: {
        title: "Concierge",
        description: "Chats with quick actions (transfers, restaurants, activities).",
      },
    },
  },
  fr: {
    brand: "MyStay",
    title: "Tableau de bord",
    subtitle: "Performance de l'hotel en un coup d'oeil. Les metriques se mettent a jour en temps reel.",
    tiles: {
      inbox: {
        title: "Boite de reception",
        description: "Conversations clients unifiees avec mises a jour en direct.",
      },
      reservations: {
        title: "Reservations",
        description: "Arrivees, sejours en cours et departs.",
      },
      payByLink: {
        title: "Paiement par lien",
        description: "Creer des liens de paiement pour depots et extras.",
      },
      requests: {
        title: "Demandes",
        description: "Demandes de service structurees et notes de passation.",
      },
      integrations: {
        title: "Integrations",
        description: "Configurer PMS, cles digitales et fournisseurs par hotel.",
      },
      reception: {
        title: "Reception",
        description: "Arrivees/departs, validation check-in, check-out et cles.",
      },
      housekeeping: {
        title: "Menage",
        description: "Tableau d'etat des chambres et affectation des taches.",
      },
      concierge: {
        title: "Conciergerie",
        description: "Discussions avec actions rapides (transferts, restaurants, activites).",
      },
    },
  },
  es: {
    brand: "MyStay",
    title: "Panel",
    subtitle: "Rendimiento del hotel de un vistazo. Las metricas se actualizan en tiempo real.",
    tiles: {
      inbox: {
        title: "Bandeja de entrada",
        description: "Conversaciones unificadas de huespedes con actualizaciones en vivo.",
      },
      reservations: {
        title: "Reservas",
        description: "Llegadas, estancias en curso y salidas.",
      },
      payByLink: {
        title: "Pagar por enlace",
        description: "Crear enlaces de pago para depositos y extras.",
      },
      requests: {
        title: "Solicitudes",
        description: "Solicitudes de servicio estructuradas y notas de relevo.",
      },
      integrations: {
        title: "Integraciones",
        description: "Configurar PMS, llaves digitales y proveedores por hotel.",
      },
      reception: {
        title: "Recepcion",
        description: "Llegadas/salidas, validacion de check-in, check-out y llaves.",
      },
      housekeeping: {
        title: "Limpieza",
        description: "Panel de estado de habitaciones y asignacion de tareas.",
      },
      concierge: {
        title: "Conserjeria",
        description: "Chats con acciones rapidas (traslados, restaurantes, actividades).",
      },
    },
  },
} as const;

export default function AdminHomePage() {
  requireStaffToken();
  const locale = resolveAdminLocale(cookies().get(adminLocaleCookieName)?.value);
  const t = dashboardCopy[locale];
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const departments = principal?.departments ?? [];
  const isAdminOrManager = role === "admin" || role === "manager";

  const visibleTiles = tiles.filter((tile) => {
    if (tile.roles && !tile.roles.includes(role)) return false;
    if (isAdminOrManager) return true;
    if (!tile.departments) return true;
    return tile.departments.some((d) => departments.includes(d));
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{t.brand}</p>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      <DashboardStats locale={locale} />

      <section className="grid gap-3 sm:grid-cols-2">
        {visibleTiles.map((tile) => (
          <Link key={tile.key} href={tile.href}>
            <Card className="transition hover:bg-accent/20">
              <CardHeader className="p-5">
                <CardTitle className="text-base">{t.tiles[tile.key].title}</CardTitle>
                <CardDescription>{t.tiles[tile.key].description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}

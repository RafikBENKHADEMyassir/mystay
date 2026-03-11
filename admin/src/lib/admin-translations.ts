import type { AdminLocale } from "@/lib/admin-locale";

type AdminMessages = {
  app: {
    adminName: string;
    platformName: string;
    departments: string;
  };
  roles: {
    admin: string;
    manager: string;
    staff: string;
  };
  actions: {
    signOut: string;
    signingOut: string;
  };
  nav: {
    dashboard: string;
    reservations: string;
    inbox: string;
    housekeeping: string;
    payByLink: string;
    messageTemplates: string;
    roomImages: string;
    upselling: string;
    usefulInformations: string;
    upsellServices: string;
    requests: string;
    integrations: string;
    staff: string;
    settings: string;
  };
  platformNav: {
    dashboard: string;
    hotels: string;
    settings: string;
    configuration: string;
    notifications: string;
    rateLimits: string;
    auditLogs: string;
    backup: string;
  };
};

const messages: Record<AdminLocale, AdminMessages> = {
  en: {
    app: {
      adminName: "MyStay Admin",
      platformName: "MyStay Platform",
      departments: "Departments",
    },
    roles: {
      admin: "Administrator",
      manager: "Hotel Manager",
      staff: "Staff",
    },
    actions: {
      signOut: "Sign out",
      signingOut: "Signing out...",
    },
    nav: {
      dashboard: "Dashboard",
      reservations: "Reservations",
      inbox: "Inbox",
      housekeeping: "Housekeeping",
      payByLink: "Pay by link",
      messageTemplates: "Message templates",
      roomImages: "Room images",
      upselling: "Upselling",
      usefulInformations: "Useful informations",
      upsellServices: "Upsell services",
      requests: "Requests",
      integrations: "Integrations",
      staff: "Staff",
      settings: "Settings",
    },
    platformNav: {
      dashboard: "Dashboard",
      hotels: "Hotels",
      settings: "Settings",
      configuration: "Configuration",
      notifications: "Notifications",
      rateLimits: "Rate limits",
      auditLogs: "Audit logs",
      backup: "Backup",
    },
  },
  fr: {
    app: {
      adminName: "MyStay Admin",
      platformName: "Plateforme MyStay",
      departments: "Departements",
    },
    roles: {
      admin: "Administrateur",
      manager: "Gestionnaire",
      staff: "Personnel",
    },
    actions: {
      signOut: "Se deconnecter",
      signingOut: "Deconnexion...",
    },
    nav: {
      dashboard: "Tableau de bord",
      reservations: "Reservations",
      inbox: "Boite de reception",
      housekeeping: "Menage",
      payByLink: "Paiement par lien",
      messageTemplates: "Modeles de messages",
      roomImages: "Images des chambres",
      upselling: "Vente incitative",
      usefulInformations: "Informations utiles",
      upsellServices: "Services additionnels",
      requests: "Demandes",
      integrations: "Integrations",
      staff: "Personnel",
      settings: "Parametres",
    },
    platformNav: {
      dashboard: "Tableau de bord",
      hotels: "Hotels",
      settings: "Parametres",
      configuration: "Configuration",
      notifications: "Notifications",
      rateLimits: "Limites de debit",
      auditLogs: "Journaux d'audit",
      backup: "Sauvegarde",
    },
  },
  es: {
    app: {
      adminName: "MyStay Admin",
      platformName: "Plataforma MyStay",
      departments: "Departamentos",
    },
    roles: {
      admin: "Administrador",
      manager: "Gerente del hotel",
      staff: "Personal",
    },
    actions: {
      signOut: "Cerrar sesion",
      signingOut: "Cerrando sesion...",
    },
    nav: {
      dashboard: "Panel",
      reservations: "Reservas",
      inbox: "Bandeja de entrada",
      housekeeping: "Limpieza",
      payByLink: "Pagar por enlace",
      messageTemplates: "Plantillas de mensajes",
      roomImages: "Imagenes de habitaciones",
      upselling: "Venta adicional",
      usefulInformations: "Informaciones utiles",
      upsellServices: "Servicios adicionales",
      requests: "Solicitudes",
      integrations: "Integraciones",
      staff: "Personal",
      settings: "Configuracion",
    },
    platformNav: {
      dashboard: "Panel",
      hotels: "Hoteles",
      settings: "Configuracion",
      configuration: "Configuracion",
      notifications: "Notificaciones",
      rateLimits: "Limites de tasa",
      auditLogs: "Registros de auditoria",
      backup: "Copia de seguridad",
    },
  },
};

export function getAdminMessages(locale: AdminLocale): AdminMessages {
  return messages[locale];
}

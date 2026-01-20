import type { Locale } from "./locales";

export type OrderTrackingStrings = {
  title: string;
  orderId: string;
  live: string;
  statuses: {
    pending: string;
    preparing: string;
    delivering: string;
    completed: string;
    cancelled: string;
  };
  updated: string;
  statusCompleted: string;
  cancelledMessage: string;
};

export function getOrderTrackingStrings(locale: Locale): OrderTrackingStrings {
  if (locale === "fr") {
    return {
      title: "Suivi de commande",
      orderId: "Commande ID:",
      live: "En direct",
      statuses: {
        pending: "Commande reçue",
        preparing: "En préparation",
        delivering: "En livraison",
        completed: "Livrée",
        cancelled: "Annulée",
      },
      updated: "Mis à jour",
      statusCompleted: "✓ Terminé",
      cancelledMessage: "Cette commande a été annulée.",
    };
  }

  if (locale === "es") {
    return {
      title: "Seguimiento de pedido",
      orderId: "ID de pedido:",
      live: "En vivo",
      statuses: {
        pending: "Pedido recibido",
        preparing: "En preparación",
        delivering: "En camino",
        completed: "Entregado",
        cancelled: "Cancelado",
      },
      updated: "Actualizado",
      statusCompleted: "✓ Completado",
      cancelledMessage: "Este pedido ha sido cancelado.",
    };
  }

  return {
    title: "Order Tracking",
    orderId: "Order ID:",
    live: "Live",
    statuses: {
      pending: "Order Received",
      preparing: "Preparing",
      delivering: "On the Way",
      completed: "Delivered",
      cancelled: "Cancelled",
    },
    updated: "Updated",
    statusCompleted: "✓ Completed",
    cancelledMessage: "This order has been cancelled.",
  };
}

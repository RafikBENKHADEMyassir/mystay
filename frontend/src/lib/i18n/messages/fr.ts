import en from "./en";

const fr: typeof en = {
  navigation: {
    home: "Accueil",
    services: "Services",
    messages: "Messages",
    profile: "Profil"
  },
  common: {
    startCheckIn: "Commencer le check-in",
    signInToAccessServices: "Connectez-vous pour accéder aux services.",
    signInToAccessRestaurants: "Connectez-vous pour accéder aux restaurants.",
    signInToAccessSpaGym: "Connectez-vous pour accéder au Spa & Gym.",
    signInToAccessRoomService: "Connectez-vous pour accéder au room service.",
    availabilityCard: {
      currentlyAvailableTo: "Actuellement disponible pour",
      chat: "échanger.",
      availability: "Disponibilités",
      from: "De",
      to: "à"
    }
  },
  servicesPage: {
    title: "Services",
    transportBadge: "Transport",
    transportBookedMessage: "Votre trajet a été réservé pour {{time}}.",
    welcomeBadge: "Bienvenue",
    welcomeMessage: "Bienvenue à {{hotelName}}. Comment pouvons-nous vous aider ?",
    checkInBadge: "Check-in",
    checkInMessage: "Effectuez votre check-in pour accéder à tous les services.",
    cards: {
      concierge: "Concierge",
      housekeeping: "Housekeeping",
      roomService: "Room Service",
      reception: "Réception",
      restaurant: "Restaurant",
      spaGym: "Spa & Gym"
    }
  },
  conciergePage: {
    title: "Concierge",
    errors: {
      createConversation: "Impossible de créer la conversation.",
      sendMessage: "Impossible d'envoyer le message.",
      serviceUnavailable: "Service indisponible."
    },
    resumeConversation: "Reprenez votre discussion :",
    viewFullConversation: "Voir la conversation complète",
    activeRequests: "Demandes en cours",
    ticketStatus: {
      inProgress: "Le concierge est en train de traiter votre demande.",
      resolved: "Demande terminée.",
      pending: "En attente."
    },
    tipPrompt: "Remerciez votre concierge pour ses services",
    leaveTip: "Laisser un pourboire",
    composerPlaceholder: "Écrire au concierge...",
    quickActions: {
      restaurant: "Réserver un restaurant",
      transport: "Organiser un transport",
      ticket: "Réserver un billet (spectacle, musée, événement)",
      airport: "Organiser un transfert aéroport",
      activities: "Demander des recommandations d'activités"
    }
  },
  roomServicePage: {
    title: "Room Service",
    orderButton: "Commander",
    errors: {
      couldNotPlaceOrder: "Impossible de passer la commande.",
      serviceUnavailable: "Service indisponible."
    },
    activeOrders: "Commandes en cours",
    ticketStatus: {
      inProgress: "🍳 En préparation...",
      resolved: "✅ Livrée",
      pending: "📋 Commande reçue"
    },
    categories: {
      breakfast: "Petit-déjeuner",
      starters: "Entrées",
      mains: "Plats",
      desserts: "Desserts",
      drinks: "Boissons",
      night: "Carte de nuit"
    },
    itemCount: "{{count}} article(s)",
    placingOrder: "Envoi en cours...",
    placeOrder: "Commander"
  },
  restaurantsPage: {
    title: "Restaurant",
    experiencesTitle: "Nos expériences culinaires",
    bookTable: "Réserver une table"
  },
  spaGymPage: {
    title: "Spa & Gym",
    tabs: {
      spa: "Spa",
      gym: "Gym"
    },
    yourBookings: "Vos réservations",
    bookingStatus: {
      confirmed: "Confirmé",
      pending: "En attente"
    },
    sectionTitles: {
      spa: "Nos soins",
      gym: "Nos activités"
    },
    chooseTimeSlot: "Choisir un créneau",
    bookingLoading: "Réservation...",
    bookingAction: "Réserver - {{price}} EUR",
    errors: {
      couldNotBook: "Impossible de réserver.",
      serviceUnavailable: "Service indisponible."
    }
  }
};

export default fr;

import en from "./en";

const es: typeof en = {
  navigation: {
    home: "Inicio",
    services: "Servicios",
    messages: "Mensajes",
    profile: "Perfil"
  },
  common: {
    startCheckIn: "Comenzar check-in",
    signInToAccessServices: "Inicia sesión para acceder a los servicios.",
    signInToAccessRestaurants: "Inicia sesión para acceder a los restaurantes.",
    signInToAccessSpaGym: "Inicia sesión para acceder a Spa y Gym.",
    signInToAccessRoomService: "Inicia sesión para acceder al room service.",
    availabilityCard: {
      currentlyAvailableTo: "Disponible ahora para",
      chat: "chatear.",
      availability: "Disponibilidad",
      from: "De",
      to: "a"
    }
  },
  servicesPage: {
    title: "Servicios",
    transportBadge: "Transporte",
    transportBookedMessage: "Tu traslado fue reservado para las {{time}}.",
    welcomeBadge: "Bienvenido",
    welcomeMessage: "Bienvenido a {{hotelName}}. ¿Cómo podemos ayudarte?",
    checkInBadge: "Check-in",
    checkInMessage: "Completa tu check-in para acceder a todos los servicios.",
    cards: {
      concierge: "Conserjería",
      housekeeping: "Limpieza",
      roomService: "Room Service",
      reception: "Recepción",
      restaurant: "Restaurante",
      spaGym: "Spa y Gym"
    }
  },
  conciergePage: {
    title: "Conserjería",
    errors: {
      createConversation: "No se pudo crear la conversación.",
      sendMessage: "No se pudo enviar el mensaje.",
      serviceUnavailable: "Servicio no disponible."
    },
    resumeConversation: "Retoma tu conversación:",
    viewFullConversation: "Ver conversación completa",
    activeRequests: "Solicitudes activas",
    ticketStatus: {
      inProgress: "El concierge está procesando tu solicitud.",
      resolved: "Solicitud completada.",
      pending: "Pendiente."
    },
    tipPrompt: "Agradece a tu concierge por su servicio",
    leaveTip: "Dejar propina",
    composerPlaceholder: "Escribe al concierge...",
    quickActions: {
      restaurant: "Reservar un restaurante",
      transport: "Organizar transporte",
      ticket: "Reservar entradas (show, museo, evento)",
      airport: "Organizar traslado al aeropuerto",
      activities: "Pedir recomendaciones de actividades"
    }
  },
  roomServicePage: {
    title: "Room Service",
    orderButton: "Pedir",
    errors: {
      couldNotPlaceOrder: "No se pudo realizar el pedido.",
      serviceUnavailable: "Servicio no disponible."
    },
    activeOrders: "Pedidos activos",
    ticketStatus: {
      inProgress: "🍳 En preparación...",
      resolved: "✅ Entregado",
      pending: "📋 Pedido recibido"
    },
    categories: {
      breakfast: "Desayuno",
      starters: "Entradas",
      mains: "Platos",
      desserts: "Postres",
      drinks: "Bebidas",
      night: "Menú nocturno"
    },
    itemCount: "{{count}} artículo(s)",
    placingOrder: "Enviando pedido...",
    placeOrder: "Realizar pedido"
  },
  restaurantsPage: {
    title: "Restaurante",
    experiencesTitle: "Nuestras experiencias culinarias",
    bookTable: "Reservar una mesa"
  },
  spaGymPage: {
    title: "Spa y Gym",
    tabs: {
      spa: "Spa",
      gym: "Gym"
    },
    yourBookings: "Tus reservas",
    bookingStatus: {
      confirmed: "Confirmado",
      pending: "Pendiente"
    },
    sectionTitles: {
      spa: "Nuestros tratamientos",
      gym: "Nuestras actividades"
    },
    chooseTimeSlot: "Elegir horario",
    bookingLoading: "Reservando...",
    bookingAction: "Reservar - {{price}} EUR",
    errors: {
      couldNotBook: "No se pudo reservar.",
      serviceUnavailable: "Servicio no disponible."
    }
  }
};

export default es;

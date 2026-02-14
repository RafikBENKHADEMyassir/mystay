const en = {
  navigation: {
    home: "Home",
    services: "Services",
    messages: "Messages",
    profile: "Profile"
  },
  common: {
    startCheckIn: "Start check-in",
    signInToAccessServices: "Sign in to access services.",
    signInToAccessRestaurants: "Sign in to access restaurants.",
    signInToAccessSpaGym: "Sign in to access Spa & Gym.",
    signInToAccessRoomService: "Sign in to access room service.",
    availabilityCard: {
      currentlyAvailableTo: "Currently available to",
      chat: "chat.",
      availability: "Availability",
      from: "From",
      to: "to"
    }
  },
  servicesPage: {
    title: "Services",
    transportBadge: "Transport",
    transportBookedMessage: "Your ride has been booked for {{time}}.",
    welcomeBadge: "Welcome",
    welcomeMessage: "Welcome to {{hotelName}}. How can we help you?",
    checkInBadge: "Check-in",
    checkInMessage: "Complete your check-in to access all services.",
    cards: {
      concierge: "Concierge",
      housekeeping: "Housekeeping",
      roomService: "Room Service",
      reception: "Reception",
      restaurant: "Restaurant",
      spaGym: "Spa & Gym"
    }
  },
  conciergePage: {
    title: "Concierge",
    errors: {
      createConversation: "Could not create conversation.",
      sendMessage: "Could not send message.",
      serviceUnavailable: "Service unavailable."
    },
    resumeConversation: "Resume your conversation:",
    viewFullConversation: "View full conversation",
    activeRequests: "Active requests",
    ticketStatus: {
      inProgress: "The concierge is processing your request.",
      resolved: "Request completed.",
      pending: "Pending."
    },
    tipPrompt: "Thank your concierge for their service",
    leaveTip: "Leave a tip",
    composerPlaceholder: "Write to concierge...",
    quickActions: {
      restaurant: "Book a restaurant",
      transport: "Arrange transport",
      ticket: "Book tickets (show, museum, event)",
      airport: "Arrange airport transfer",
      activities: "Request activity recommendations"
    }
  },
  roomServicePage: {
    title: "Room Service",
    orderButton: "Order",
    errors: {
      couldNotPlaceOrder: "Could not place order.",
      serviceUnavailable: "Service unavailable."
    },
    activeOrders: "Active orders",
    ticketStatus: {
      inProgress: "🍳 Being prepared...",
      resolved: "✅ Delivered",
      pending: "📋 Order received"
    },
    categories: {
      breakfast: "Breakfast",
      starters: "Starters",
      mains: "Mains",
      desserts: "Desserts",
      drinks: "Drinks",
      night: "Late night"
    },
    itemCount: "{{count}} item(s)",
    placingOrder: "Placing order...",
    placeOrder: "Place order"
  },
  restaurantsPage: {
    title: "Restaurant",
    experiencesTitle: "Our culinary experiences",
    bookTable: "Book a table"
  },
  spaGymPage: {
    title: "Spa & Gym",
    tabs: {
      spa: "Spa",
      gym: "Gym"
    },
    yourBookings: "Your bookings",
    bookingStatus: {
      confirmed: "Confirmed",
      pending: "Pending"
    },
    sectionTitles: {
      spa: "Our treatments",
      gym: "Our activities"
    },
    chooseTimeSlot: "Choose a time slot",
    bookingLoading: "Booking...",
    bookingAction: "Book - {{price}} EUR",
    errors: {
      couldNotBook: "Could not book.",
      serviceUnavailable: "Service unavailable."
    }
  }
};

export default en;

/**
 * Mock PMS Data
 * 
 * Comprehensive mock data for simulating a Property Management System.
 * Includes hotels, guests, reservations, rooms, menus, and spa services.
 */

// Helper to get dates relative to today
function getDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

const TODAY = getDate(0);
const TOMORROW = getDate(1);
const YESTERDAY = getDate(-1);

// =====================================================
// HOTELS/PROPERTIES
// =====================================================

export const mockData = {
  properties: {
    "FS-PARIS": {
      id: "FS-PARIS",
      name: "Four Seasons Hotel George V",
      code: "FSGV",
      address: "31 Avenue George V",
      city: "Paris",
      country: "France",
      timezone: "Europe/Paris",
      currency: "EUR",
      starRating: 5,
      phoneNumber: "+33 1 49 52 70 00",
      email: "reservations.paris@fourseasons.com",
      features: ["spa", "restaurant", "concierge", "roomService", "valet"],
      rooms: 244,
      checkInTime: "15:00",
      checkOutTime: "12:00"
    },
    "FS-GENEVA": {
      id: "FS-GENEVA",
      name: "Four Seasons Hotel des Bergues",
      code: "FSGE",
      address: "33 Quai des Bergues",
      city: "Geneva",
      country: "Switzerland",
      timezone: "Europe/Zurich",
      currency: "CHF",
      starRating: 5,
      phoneNumber: "+41 22 908 70 00",
      email: "reservations.geneva@fourseasons.com",
      features: ["spa", "restaurant", "concierge", "roomService", "lakefront"],
      rooms: 81,
      checkInTime: "15:00",
      checkOutTime: "12:00"
    },
    "BH-MILAN": {
      id: "BH-MILAN",
      name: "Bulgari Hotel Milano",
      code: "BHMI",
      address: "Via Privata Fratelli Gabba 7b",
      city: "Milan",
      country: "Italy",
      timezone: "Europe/Rome",
      currency: "EUR",
      starRating: 5,
      phoneNumber: "+39 02 8058 051",
      email: "milano@bulgarihotels.com",
      features: ["spa", "restaurant", "garden", "concierge", "roomService"],
      rooms: 58,
      checkInTime: "15:00",
      checkOutTime: "12:00"
    },
    "MN-MARRAKECH": {
      id: "MN-MARRAKECH",
      name: "La Mamounia",
      code: "LAMM",
      address: "Avenue Bab Jdid",
      city: "Marrakech",
      country: "Morocco",
      timezone: "Africa/Casablanca",
      currency: "MAD",
      starRating: 5,
      phoneNumber: "+212 5 24 38 86 00",
      email: "reservations@mamounia.com",
      features: ["spa", "restaurant", "pool", "garden", "hammam"],
      rooms: 210,
      checkInTime: "15:00",
      checkOutTime: "12:00"
    }
  },

  // =====================================================
  // GUEST PROFILES
  // =====================================================
  guests: {
    "GUEST-001": {
      id: "GUEST-001",
      firstName: "Sophie",
      lastName: "Martin",
      email: "sophie.martin@email.com",
      phone: "+33 6 12 34 56 78",
      nationality: "FR",
      language: "fr",
      dateOfBirth: "1985-03-15",
      vipStatus: "gold",
      preferences: {
        roomType: "suite",
        floorPreference: "high",
        pillow: "soft",
        newspaper: "Le Monde",
        dietary: ["vegetarian"]
      },
      loyaltyNumber: "FS-GOLD-12345",
      totalStays: 12,
      totalSpent: 45000,
      lastVisit: "2025-11-15"
    },
    "GUEST-002": {
      id: "GUEST-002",
      firstName: "James",
      lastName: "Wilson",
      email: "james.wilson@corp.com",
      phone: "+1 212 555 0123",
      nationality: "US",
      language: "en",
      dateOfBirth: "1978-07-22",
      vipStatus: "platinum",
      preferences: {
        roomType: "junior-suite",
        floorPreference: "high",
        pillow: "firm",
        newspaper: "WSJ",
        dietary: []
      },
      loyaltyNumber: "FS-PLAT-98765",
      companyName: "Wilson & Associates",
      totalStays: 45,
      totalSpent: 180000,
      lastVisit: "2025-12-01"
    },
    "GUEST-003": {
      id: "GUEST-003",
      firstName: "Yuki",
      lastName: "Tanaka",
      email: "yuki.tanaka@example.jp",
      phone: "+81 90 1234 5678",
      nationality: "JP",
      language: "ja",
      dateOfBirth: "1990-11-08",
      vipStatus: "silver",
      preferences: {
        roomType: "deluxe",
        floorPreference: "any",
        pillow: "medium",
        dietary: ["pescatarian"]
      },
      loyaltyNumber: "FS-SILV-54321",
      totalStays: 5,
      totalSpent: 15000,
      lastVisit: "2025-09-20"
    },
    "GUEST-004": {
      id: "GUEST-004",
      firstName: "Mohammed",
      lastName: "Al-Rashid",
      email: "m.alrashid@business.ae",
      phone: "+971 50 123 4567",
      nationality: "AE",
      language: "ar",
      dateOfBirth: "1982-01-30",
      vipStatus: "platinum",
      preferences: {
        roomType: "presidential-suite",
        floorPreference: "top",
        pillow: "firm",
        dietary: ["halal"],
        roomOrientation: "city-view"
      },
      loyaltyNumber: "FS-PLAT-11111",
      totalStays: 28,
      totalSpent: 320000,
      lastVisit: "2025-12-10"
    },
    "GUEST-005": {
      id: "GUEST-005",
      firstName: "Emma",
      lastName: "Dubois",
      email: "emma.dubois@gmail.com",
      phone: "+33 6 98 76 54 32",
      nationality: "FR",
      language: "fr",
      dateOfBirth: "1995-06-25",
      vipStatus: null,
      preferences: {
        roomType: "superior",
        dietary: []
      },
      totalStays: 1,
      totalSpent: 1200,
      lastVisit: null
    }
  },

  // =====================================================
  // RESERVATIONS
  // =====================================================
  reservations: {
    "RES-2025-0001": {
      id: "RES-2025-0001",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025A1B2C",
      status: "checked_in",
      source: "direct",
      guestId: "GUEST-001",
      guest: {
        firstName: "Sophie",
        lastName: "Martin",
        email: "sophie.martin@email.com",
        phone: "+33 6 12 34 56 78"
      },
      checkInDate: TODAY,
      checkOutDate: getDate(3),
      nights: 3,
      roomType: "Suite",
      roomNumber: "701",
      roomRate: 1500,
      currency: "EUR",
      totalAmount: 4500,
      adults: 2,
      children: 0,
      specialRequests: "High floor, quiet room, champagne upon arrival",
      packages: ["breakfast", "spa-credit"],
      checkedInAt: new Date().toISOString(),
      createdAt: "2025-01-10T14:30:00Z"
    },
    "RES-2025-0002": {
      id: "RES-2025-0002",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025D3E4F",
      status: "confirmed",
      source: "booking.com",
      guestId: "GUEST-002",
      guest: {
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@corp.com",
        phone: "+1 212 555 0123"
      },
      checkInDate: TOMORROW,
      checkOutDate: getDate(4),
      nights: 3,
      roomType: "Junior Suite",
      roomNumber: null,
      roomRate: 1200,
      currency: "EUR",
      totalAmount: 3600,
      adults: 1,
      children: 0,
      specialRequests: "Late check-in expected (around 10pm)",
      packages: ["breakfast"],
      createdAt: "2025-01-12T09:15:00Z"
    },
    "RES-2025-0003": {
      id: "RES-2025-0003",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025G5H6I",
      status: "confirmed",
      source: "expedia",
      guestId: "GUEST-003",
      guest: {
        firstName: "Yuki",
        lastName: "Tanaka",
        email: "yuki.tanaka@example.jp",
        phone: "+81 90 1234 5678"
      },
      checkInDate: TODAY,
      checkOutDate: getDate(5),
      nights: 5,
      roomType: "Deluxe Room",
      roomNumber: null,
      roomRate: 850,
      currency: "EUR",
      totalAmount: 4250,
      adults: 2,
      children: 0,
      specialRequests: "Japanese green tea in room",
      packages: [],
      createdAt: "2025-01-08T16:45:00Z"
    },
    "RES-2025-0004": {
      id: "RES-2025-0004",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025J7K8L",
      status: "checked_in",
      source: "direct",
      guestId: "GUEST-004",
      guest: {
        firstName: "Mohammed",
        lastName: "Al-Rashid",
        email: "m.alrashid@business.ae",
        phone: "+971 50 123 4567"
      },
      checkInDate: YESTERDAY,
      checkOutDate: getDate(2),
      nights: 3,
      roomType: "Presidential Suite",
      roomNumber: "PH1",
      roomRate: 8500,
      currency: "EUR",
      totalAmount: 25500,
      adults: 2,
      children: 2,
      specialRequests: "Halal meals only, connecting rooms for family, personal butler",
      packages: ["breakfast", "spa-unlimited", "airport-transfer", "butler-service"],
      checkedInAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: "2025-01-05T11:00:00Z"
    },
    "RES-2025-0005": {
      id: "RES-2025-0005",
      propertyId: "FS-PARIS",
      confirmationNumber: "FSGV2025M9N0P",
      status: "confirmed",
      source: "direct",
      guestId: "GUEST-005",
      guest: {
        firstName: "Emma",
        lastName: "Dubois",
        email: "emma.dubois@gmail.com",
        phone: "+33 6 98 76 54 32"
      },
      checkInDate: getDate(2),
      checkOutDate: getDate(4),
      nights: 2,
      roomType: "Superior Room",
      roomNumber: null,
      roomRate: 650,
      currency: "EUR",
      totalAmount: 1300,
      adults: 1,
      children: 0,
      specialRequests: "Anniversary celebration",
      packages: ["breakfast"],
      createdAt: "2025-01-15T20:30:00Z"
    },
    // Geneva reservations
    "RES-2025-0010": {
      id: "RES-2025-0010",
      propertyId: "FS-GENEVA",
      confirmationNumber: "FSGE2025A1A1A",
      status: "checked_in",
      source: "direct",
      guestId: "GUEST-002",
      guest: {
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@corp.com",
        phone: "+1 212 555 0123"
      },
      checkInDate: TODAY,
      checkOutDate: getDate(2),
      nights: 2,
      roomType: "Lake View Suite",
      roomNumber: "401",
      roomRate: 2200,
      currency: "CHF",
      totalAmount: 4400,
      adults: 1,
      children: 0,
      specialRequests: "Meeting room required for business meetings",
      packages: ["breakfast", "business-center"],
      checkedInAt: new Date().toISOString(),
      createdAt: "2025-01-14T08:00:00Z"
    },
    // Milan reservations
    "RES-2025-0020": {
      id: "RES-2025-0020",
      propertyId: "BH-MILAN",
      confirmationNumber: "BHMI2025X1Y2Z",
      status: "confirmed",
      source: "booking.com",
      guestId: "GUEST-001",
      guest: {
        firstName: "Sophie",
        lastName: "Martin",
        email: "sophie.martin@email.com",
        phone: "+33 6 12 34 56 78"
      },
      checkInDate: getDate(5),
      checkOutDate: getDate(8),
      nights: 3,
      roomType: "Bulgari Suite",
      roomNumber: null,
      roomRate: 1800,
      currency: "EUR",
      totalAmount: 5400,
      adults: 2,
      children: 0,
      specialRequests: "Fashion week - need concierge assistance with show tickets",
      packages: ["breakfast", "spa-treatment"],
      createdAt: "2025-01-03T14:00:00Z"
    },
    // Marrakech reservations
    "RES-2025-0030": {
      id: "RES-2025-0030",
      propertyId: "MN-MARRAKECH",
      confirmationNumber: "LAMM2025H1H2H",
      status: "confirmed",
      source: "direct",
      guestId: "GUEST-004",
      guest: {
        firstName: "Mohammed",
        lastName: "Al-Rashid",
        email: "m.alrashid@business.ae",
        phone: "+971 50 123 4567"
      },
      checkInDate: getDate(10),
      checkOutDate: getDate(17),
      nights: 7,
      roomType: "Riads Privés",
      roomNumber: null,
      roomRate: 4500,
      currency: "MAD",
      totalAmount: 31500,
      adults: 4,
      children: 3,
      specialRequests: "Family vacation, private pool required, halal meals, Arabic-speaking staff",
      packages: ["all-inclusive", "airport-transfer", "private-guide"],
      createdAt: "2025-01-02T10:00:00Z"
    }
  },

  // =====================================================
  // ROOMS
  // =====================================================
  rooms: {
    // Paris - Floor 7 (Suites)
    "FS-PARIS-701": {
      id: "FS-PARIS-701",
      propertyId: "FS-PARIS",
      number: "701",
      type: "Suite",
      floor: 7,
      status: "occupied",
      currentGuestId: "GUEST-001",
      features: ["king-bed", "city-view", "balcony", "jacuzzi"],
      maxOccupancy: 3,
      sqm: 75,
      pricePerNight: 1500
    },
    "FS-PARIS-702": {
      id: "FS-PARIS-702",
      propertyId: "FS-PARIS",
      number: "702",
      type: "Suite",
      floor: 7,
      status: "clean",
      currentGuestId: null,
      features: ["king-bed", "garden-view", "balcony"],
      maxOccupancy: 3,
      sqm: 70,
      pricePerNight: 1400
    },
    "FS-PARIS-703": {
      id: "FS-PARIS-703",
      propertyId: "FS-PARIS",
      number: "703",
      type: "Junior Suite",
      floor: 7,
      status: "clean",
      currentGuestId: null,
      features: ["king-bed", "city-view"],
      maxOccupancy: 2,
      sqm: 55,
      pricePerNight: 1200
    },
    // Paris - Floor 6 (Deluxe)
    "FS-PARIS-601": {
      id: "FS-PARIS-601",
      propertyId: "FS-PARIS",
      number: "601",
      type: "Deluxe Room",
      floor: 6,
      status: "dirty",
      currentGuestId: null,
      features: ["king-bed", "city-view"],
      maxOccupancy: 2,
      sqm: 45,
      pricePerNight: 850
    },
    "FS-PARIS-602": {
      id: "FS-PARIS-602",
      propertyId: "FS-PARIS",
      number: "602",
      type: "Deluxe Room",
      floor: 6,
      status: "clean",
      currentGuestId: null,
      features: ["twin-beds", "garden-view"],
      maxOccupancy: 2,
      sqm: 45,
      pricePerNight: 800
    },
    // Paris - Floor 5 (Superior)
    "FS-PARIS-501": {
      id: "FS-PARIS-501",
      propertyId: "FS-PARIS",
      number: "501",
      type: "Superior Room",
      floor: 5,
      status: "clean",
      currentGuestId: null,
      features: ["king-bed", "courtyard-view"],
      maxOccupancy: 2,
      sqm: 38,
      pricePerNight: 650
    },
    "FS-PARIS-502": {
      id: "FS-PARIS-502",
      propertyId: "FS-PARIS",
      number: "502",
      type: "Superior Room",
      floor: 5,
      status: "maintenance",
      currentGuestId: null,
      features: ["twin-beds", "courtyard-view"],
      maxOccupancy: 2,
      sqm: 38,
      pricePerNight: 650,
      maintenanceNote: "Bathroom renovation"
    },
    // Paris - Penthouse
    "FS-PARIS-PH1": {
      id: "FS-PARIS-PH1",
      propertyId: "FS-PARIS",
      number: "PH1",
      type: "Presidential Suite",
      floor: 8,
      status: "occupied",
      currentGuestId: "GUEST-004",
      features: ["king-bed", "panoramic-view", "terrace", "private-elevator", "dining-room", "kitchen", "butler-pantry"],
      maxOccupancy: 6,
      sqm: 350,
      pricePerNight: 8500
    }
  },

  // =====================================================
  // FOLIOS (BILLING)
  // =====================================================
  folios: {
    "RES-2025-0001": {
      reservationId: "RES-2025-0001",
      currency: "EUR",
      charges: [
        { id: "CHG-001", date: TODAY, description: "Room charge - Suite", amount: 1500, category: "room" },
        { id: "CHG-002", date: TODAY, description: "Breakfast - Le Cinq", amount: 95, category: "restaurant" },
        { id: "CHG-003", date: TODAY, description: "Mini bar", amount: 45, category: "minibar" },
        { id: "CHG-004", date: TODAY, description: "Spa - Deep tissue massage", amount: 220, category: "spa" }
      ],
      payments: [
        { id: "PAY-001", date: "2025-01-10", description: "Deposit", amount: 1500, method: "credit_card" }
      ],
      balance: 360
    },
    "RES-2025-0004": {
      reservationId: "RES-2025-0004",
      currency: "EUR",
      charges: [
        { id: "CHG-010", date: YESTERDAY, description: "Room charge - Presidential Suite", amount: 8500, category: "room" },
        { id: "CHG-011", date: YESTERDAY, description: "Private dining - 6 guests", amount: 1800, category: "restaurant" },
        { id: "CHG-012", date: YESTERDAY, description: "In-room massage x2", amount: 600, category: "spa" },
        { id: "CHG-013", date: TODAY, description: "Room charge - Presidential Suite", amount: 8500, category: "room" },
        { id: "CHG-014", date: TODAY, description: "Breakfast in-room", amount: 380, category: "restaurant" },
        { id: "CHG-015", date: TODAY, description: "Limousine service", amount: 750, category: "transport" }
      ],
      payments: [
        { id: "PAY-010", date: "2025-01-05", description: "Advance payment", amount: 15000, method: "wire_transfer" }
      ],
      balance: 5530
    }
  },

  // =====================================================
  // ROOM SERVICE MENUS
  // =====================================================
  menus: {
    default: {
      id: "menu-default",
      name: "24/7 In-Room Dining",
      availableHours: "24/7",
      categories: [
        {
          id: "breakfast",
          name: "Breakfast",
          availableFrom: "06:30",
          availableUntil: "11:00",
          items: [
            { id: "BF-001", name: "Continental Breakfast", description: "Croissants, pain au chocolat, fresh bread, butter, jam, orange juice, coffee or tea", price: 45, currency: "EUR", dietaryTags: ["vegetarian"] },
            { id: "BF-002", name: "American Breakfast", description: "Two eggs any style, bacon or sausage, hash browns, toast, juice, coffee", price: 55, currency: "EUR" },
            { id: "BF-003", name: "Healthy Start", description: "Acai bowl, fresh fruits, Greek yogurt, granola, green smoothie", price: 42, currency: "EUR", dietaryTags: ["vegetarian", "gluten-free-option"] },
            { id: "BF-004", name: "Eggs Benedict Royale", description: "Poached eggs, smoked salmon, hollandaise, English muffin", price: 48, currency: "EUR" },
            { id: "BF-005", name: "French Toast", description: "Brioche French toast, maple syrup, fresh berries, whipped cream", price: 38, currency: "EUR", dietaryTags: ["vegetarian"] }
          ]
        },
        {
          id: "starters",
          name: "Starters & Salads",
          availableFrom: "11:00",
          availableUntil: "23:00",
          items: [
            { id: "ST-001", name: "Caesar Salad", description: "Romaine, parmesan, croutons, Caesar dressing", price: 28, currency: "EUR", dietaryTags: ["gluten-free-option"] },
            { id: "ST-002", name: "Burrata Caprese", description: "Fresh burrata, heirloom tomatoes, basil, aged balsamic", price: 32, currency: "EUR", dietaryTags: ["vegetarian", "gluten-free"] },
            { id: "ST-003", name: "French Onion Soup", description: "Classic gratinée with Gruyère crouton", price: 24, currency: "EUR" },
            { id: "ST-004", name: "Tuna Tartare", description: "Yellowfin tuna, avocado, sesame, crispy wontons", price: 36, currency: "EUR" }
          ]
        },
        {
          id: "mains",
          name: "Main Courses",
          availableFrom: "12:00",
          availableUntil: "23:00",
          items: [
            { id: "MC-001", name: "Club Sandwich", description: "Triple-decker, chicken, bacon, egg, fries", price: 38, currency: "EUR" },
            { id: "MC-002", name: "Wagyu Burger", description: "200g Wagyu beef, truffle aioli, aged cheddar, brioche bun", price: 48, currency: "EUR" },
            { id: "MC-003", name: "Grilled Sea Bass", description: "Mediterranean vegetables, olive oil, lemon", price: 52, currency: "EUR", dietaryTags: ["gluten-free"] },
            { id: "MC-004", name: "Beef Tenderloin", description: "250g filet, béarnaise, pommes purée, seasonal vegetables", price: 68, currency: "EUR", dietaryTags: ["gluten-free"] },
            { id: "MC-005", name: "Truffle Risotto", description: "Carnaroli rice, black truffle, parmesan foam", price: 56, currency: "EUR", dietaryTags: ["vegetarian", "gluten-free"] },
            { id: "MC-006", name: "Lobster Linguine", description: "Half Maine lobster, cherry tomatoes, basil, white wine", price: 72, currency: "EUR" }
          ]
        },
        {
          id: "desserts",
          name: "Desserts",
          availableFrom: "12:00",
          availableUntil: "23:30",
          items: [
            { id: "DS-001", name: "Chocolate Fondant", description: "Warm chocolate cake, vanilla ice cream", price: 22, currency: "EUR", dietaryTags: ["vegetarian"] },
            { id: "DS-002", name: "Crème Brûlée", description: "Classic vanilla crème brûlée", price: 18, currency: "EUR", dietaryTags: ["vegetarian", "gluten-free"] },
            { id: "DS-003", name: "Fresh Fruit Platter", description: "Seasonal fruits, passion fruit coulis", price: 24, currency: "EUR", dietaryTags: ["vegan", "gluten-free"] },
            { id: "DS-004", name: "Cheese Selection", description: "French artisanal cheeses, honeycomb, walnut bread", price: 32, currency: "EUR", dietaryTags: ["vegetarian"] }
          ]
        },
        {
          id: "late-night",
          name: "Late Night",
          availableFrom: "23:00",
          availableUntil: "06:00",
          items: [
            { id: "LN-001", name: "Croque Monsieur", description: "Ham, Gruyère, béchamel, fries", price: 28, currency: "EUR" },
            { id: "LN-002", name: "Soup of the Day", description: "Chef's daily selection with bread", price: 18, currency: "EUR", dietaryTags: ["vegetarian-option"] },
            { id: "LN-003", name: "Cheese & Charcuterie", description: "Selection of French cheeses and cured meats", price: 38, currency: "EUR" },
            { id: "LN-004", name: "Ice Cream Selection", description: "Three scoops, choice of flavors", price: 16, currency: "EUR", dietaryTags: ["vegetarian", "gluten-free"] }
          ]
        },
        {
          id: "beverages",
          name: "Beverages",
          availableFrom: "00:00",
          availableUntil: "23:59",
          items: [
            { id: "BV-001", name: "Espresso / Double Espresso", price: 8, currency: "EUR", dietaryTags: ["vegan"] },
            { id: "BV-002", name: "Cappuccino / Latte", price: 10, currency: "EUR", dietaryTags: ["vegetarian"] },
            { id: "BV-003", name: "Selection of Teas", price: 9, currency: "EUR", dietaryTags: ["vegan"] },
            { id: "BV-004", name: "Fresh Orange Juice", price: 14, currency: "EUR", dietaryTags: ["vegan"] },
            { id: "BV-005", name: "Smoothie", description: "Choice of tropical, berry, or green", price: 16, currency: "EUR", dietaryTags: ["vegan"] },
            { id: "BV-006", name: "Bottle of Evian (75cl)", price: 12, currency: "EUR", dietaryTags: ["vegan"] }
          ]
        }
      ],
      childrenMenu: {
        name: "Little Gourmets",
        items: [
          { id: "KD-001", name: "Chicken Nuggets & Fries", price: 22, currency: "EUR" },
          { id: "KD-002", name: "Pasta with Tomato Sauce", price: 18, currency: "EUR", dietaryTags: ["vegetarian"] },
          { id: "KD-003", name: "Mini Burger", price: 24, currency: "EUR" },
          { id: "KD-004", name: "Ice Cream Sundae", price: 14, currency: "EUR", dietaryTags: ["vegetarian"] }
        ]
      }
    }
  },

  // =====================================================
  // SPA SERVICES
  // =====================================================
  spaServices: {
    default: {
      id: "spa-default",
      name: "Le Spa",
      operatingHours: "08:00 - 21:00",
      categories: [
        {
          id: "massage",
          name: "Massages",
          items: [
            { id: "SPA-001", name: "Swedish Relaxation Massage", description: "Classic relaxation massage with medium pressure", duration: 60, price: 180, currency: "EUR" },
            { id: "SPA-002", name: "Deep Tissue Massage", description: "Therapeutic massage targeting muscle tension", duration: 60, price: 220, currency: "EUR" },
            { id: "SPA-003", name: "Hot Stone Therapy", description: "Heated basalt stones combined with massage techniques", duration: 90, price: 280, currency: "EUR" },
            { id: "SPA-004", name: "Couples Massage", description: "Side-by-side massage for two in our couple's suite", duration: 60, price: 380, currency: "EUR" },
            { id: "SPA-005", name: "Aromatherapy Journey", description: "Custom essential oil blend with full body massage", duration: 75, price: 240, currency: "EUR" }
          ]
        },
        {
          id: "facials",
          name: "Facials",
          items: [
            { id: "SPA-010", name: "Signature Facial", description: "Customized facial treatment for your skin type", duration: 60, price: 195, currency: "EUR" },
            { id: "SPA-011", name: "Anti-Aging Treatment", description: "Advanced treatment with collagen-boosting technology", duration: 90, price: 295, currency: "EUR" },
            { id: "SPA-012", name: "Hydrating Facial", description: "Deep hydration for dry or dehydrated skin", duration: 60, price: 175, currency: "EUR" },
            { id: "SPA-013", name: "Men's Facial", description: "Tailored treatment for men's skincare needs", duration: 45, price: 150, currency: "EUR" }
          ]
        },
        {
          id: "body",
          name: "Body Treatments",
          items: [
            { id: "SPA-020", name: "Body Scrub & Wrap", description: "Exfoliation followed by nourishing body wrap", duration: 90, price: 250, currency: "EUR" },
            { id: "SPA-021", name: "Detox Treatment", description: "Stimulating treatment to eliminate toxins", duration: 60, price: 195, currency: "EUR" },
            { id: "SPA-022", name: "After-Sun Recovery", description: "Cooling and hydrating treatment for sun-exposed skin", duration: 45, price: 145, currency: "EUR" }
          ]
        },
        {
          id: "packages",
          name: "Spa Journeys",
          items: [
            { id: "SPA-030", name: "Half-Day Retreat", description: "3-hour experience: massage, facial, and light lunch", duration: 180, price: 450, currency: "EUR" },
            { id: "SPA-031", name: "Ultimate Relaxation", description: "Full day spa access with treatments and meals", duration: 360, price: 750, currency: "EUR" },
            { id: "SPA-032", name: "Romantic Escape", description: "Couple's experience with champagne, massage, and private suite", duration: 150, price: 650, currency: "EUR" }
          ]
        },
        {
          id: "wellness",
          name: "Wellness",
          items: [
            { id: "SPA-040", name: "Private Yoga Session", description: "One-on-one yoga instruction", duration: 60, price: 150, currency: "EUR" },
            { id: "SPA-041", name: "Personal Training", description: "Customized workout with certified trainer", duration: 60, price: 160, currency: "EUR" },
            { id: "SPA-042", name: "Meditation Session", description: "Guided meditation for stress relief", duration: 45, price: 120, currency: "EUR" }
          ]
        }
      ],
      facilities: [
        { name: "Swimming Pool", description: "15m indoor heated pool", included: true },
        { name: "Hammam", description: "Traditional steam bath", included: true },
        { name: "Sauna", description: "Finnish dry sauna", included: true },
        { name: "Fitness Center", description: "State-of-the-art equipment", included: true },
        { name: "Relaxation Lounge", description: "With tea service", included: true }
      ]
    },
    "MN-MARRAKECH": {
      id: "spa-marrakech",
      name: "Le Spa & Hammam",
      operatingHours: "09:00 - 20:00",
      categories: [
        {
          id: "hammam",
          name: "Traditional Hammam",
          items: [
            { id: "HAM-001", name: "Royal Hammam Ritual", description: "Traditional black soap, exfoliation with kessa glove, rhassoul clay mask", duration: 90, price: 195, currency: "EUR" },
            { id: "HAM-002", name: "Signature Hammam", description: "Essential hammam experience with black soap and scrub", duration: 60, price: 145, currency: "EUR" },
            { id: "HAM-003", name: "Couple's Hammam", description: "Private hammam experience for two", duration: 90, price: 350, currency: "EUR" }
          ]
        },
        {
          id: "massage",
          name: "Oriental Massages",
          items: [
            { id: "MAS-001", name: "Argan Oil Massage", description: "Relaxing massage with pure Moroccan argan oil", duration: 60, price: 175, currency: "EUR" },
            { id: "MAS-002", name: "Four Hands Massage", description: "Synchronized massage by two therapists", duration: 60, price: 320, currency: "EUR" },
            { id: "MAS-003", name: "Oriental Ritual", description: "Full body massage with traditional techniques", duration: 90, price: 245, currency: "EUR" }
          ]
        },
        {
          id: "beauty",
          name: "Beauty Rituals",
          items: [
            { id: "BTY-001", name: "Rose Face Treatment", description: "Facial with Moroccan rose water and argan", duration: 60, price: 165, currency: "EUR" },
            { id: "BTY-002", name: "Henna Art", description: "Traditional Moroccan henna application", duration: 45, price: 95, currency: "EUR" }
          ]
        }
      ],
      facilities: [
        { name: "Traditional Hammam", description: "Authentic Moroccan steam bath", included: true },
        { name: "Outdoor Pool", description: "Heated outdoor pool with garden views", included: true },
        { name: "Relaxation Gardens", description: "Tranquil outdoor relaxation areas", included: true }
      ]
    }
  }
};

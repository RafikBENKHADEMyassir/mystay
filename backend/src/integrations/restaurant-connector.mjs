// backend/src/integrations/restaurant-connector.mjs
// Restaurant POS/Booking integration for table reservations and menu management

/**
 * Restaurant connector for OpenTable, SevenRooms, or generic POS systems
 * Handles table reservations, menu syncing, and order management
 */

class RestaurantConnector {
  constructor(config) {
    this.provider = config.provider; // 'opentable', 'sevenrooms', 'generic'
    this.apiKey = config.apiKey;
    this.restaurantId = config.restaurantId;
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.provider) {
      case "opentable":
        return "https://api.opentable.com/v2";
      case "sevenrooms":
        return "https://api.sevenrooms.com/v2";
      case "generic":
        return this.config?.customUrl || "https://api.restaurant-pos.example.com";
      default:
        throw new Error(`Unknown restaurant provider: ${this.provider}`);
    }
  }

  /**
   * Get restaurant availability for a specific date/time
   * @param {Object} params - { date, time, partySize }
   * @returns {Promise<Object>} Available time slots
   */
  async getAvailability({ date, time, partySize }) {
    const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/availability`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      params: new URLSearchParams({
        date,
        time,
        party_size: partySize.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Restaurant API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeAvailability(data);
  }

  /**
   * Create a table reservation
   * @param {Object} params - { date, time, partySize, guestName, guestEmail, guestPhone, specialRequests }
   * @returns {Promise<Object>} Reservation details
   */
  async createReservation({
    date,
    time,
    partySize,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests = ""
  }) {
    const payload = this.buildReservationPayload({
      date,
      time,
      partySize,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    });

    const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Reservation failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeReservation(data);
  }

  /**
   * Update existing reservation
   * @param {string} reservationId
   * @param {Object} updates - { time, partySize, specialRequests }
   * @returns {Promise<Object>}
   */
  async updateReservation(reservationId, updates) {
    const payload = this.buildReservationUpdatePayload(updates);

    const response = await fetch(
      `${this.baseUrl}/restaurants/${this.restaurantId}/reservations/${reservationId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a reservation
   * @param {string} reservationId
   * @returns {Promise<Object>}
   */
  async cancelReservation(reservationId) {
    const response = await fetch(
      `${this.baseUrl}/restaurants/${this.restaurantId}/reservations/${reservationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cancellation failed: ${response.statusText}`);
    }

    return { success: true, reservationId };
  }

  /**
   * Get restaurant menu
   * @returns {Promise<Object>} Menu with categories and items
   */
  async getMenu() {
    const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/menu`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Menu fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeMenu(data);
  }

  /**
   * Update menu item availability
   * @param {string} itemId
   * @param {boolean} available
   * @returns {Promise<Object>}
   */
  async updateMenuItemAvailability(itemId, available) {
    const response = await fetch(
      `${this.baseUrl}/restaurants/${this.restaurantId}/menu/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ available }),
      }
    );

    if (!response.ok) {
      throw new Error(`Menu update failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create room service order (for hotels)
   * @param {Object} params - { items, roomNumber, guestName, deliveryTime, specialInstructions }
   * @returns {Promise<Object>} Order details
   */
  async createRoomServiceOrder({
    items,
    roomNumber,
    guestName,
    deliveryTime = "ASAP",
    specialInstructions = ""
  }) {
    const payload = {
      type: "room_service",
      room_number: roomNumber,
      guest_name: guestName,
      delivery_time: deliveryTime,
      items: items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        modifications: item.modifications || [],
      })),
      special_instructions: specialInstructions,
    };

    const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Order failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeOrder(data);
  }

  /**
   * Update order status (for staff)
   * @param {string} orderId
   * @param {string} status - 'pending', 'preparing', 'delivering', 'completed', 'cancelled'
   * @returns {Promise<Object>}
   */
  async updateOrderStatus(orderId, status) {
    const response = await fetch(
      `${this.baseUrl}/restaurants/${this.restaurantId}/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(`Status update failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Provider-specific payload builders
  buildReservationPayload(params) {
    const base = {
      restaurant_id: this.restaurantId,
      date: params.date,
      time: params.time,
      party_size: params.partySize,
      guest: {
        name: params.guestName,
        email: params.guestEmail,
        phone: params.guestPhone,
      },
      special_requests: params.specialRequests,
    };

    // Customize for specific providers
    switch (this.provider) {
      case "opentable":
        return {
          ...base,
          source: "api",
          confirmation_email: true,
        };
      case "sevenrooms":
        return {
          ...base,
          venue_id: this.restaurantId,
          send_confirmation: true,
        };
      default:
        return base;
    }
  }

  buildReservationUpdatePayload(updates) {
    return updates;
  }

  // Data normalization helpers
  normalizeAvailability(data) {
    return {
      availableSlots: data.slots || data.availability || [],
      date: data.date,
    };
  }

  normalizeReservation(data) {
    return {
      id: data.id || data.reservation_id || data.confirmationNumber,
      confirmationNumber: data.confirmation || data.confirmationNumber,
      status: data.status,
      date: data.date,
      time: data.time,
      partySize: data.party_size || data.partySize,
      guest: {
        name: data.guest?.name || data.guestName,
        email: data.guest?.email || data.guestEmail,
        phone: data.guest?.phone || data.guestPhone,
      },
    };
  }

  normalizeMenu(data) {
    return {
      categories: data.categories || data.menu?.categories || [],
      items: data.items || data.menu?.items || [],
    };
  }

  normalizeOrder(data) {
    return {
      id: data.id || data.order_id,
      status: data.status || "pending",
      items: data.items,
      total: data.total || data.amount,
      createdAt: data.created_at || data.createdAt,
    };
  }
}

export { RestaurantConnector };

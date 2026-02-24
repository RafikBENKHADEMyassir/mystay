// backend/src/integrations/pms-connector.mjs
// PMS Integration connector for fetching reservation and folio data

/**
 * Generic PMS connector interface
 * Implementations for specific providers (Opera, Mews, Cloudbeds)
 * 
 * The Mock PMS server (http://localhost:4010) provides all these endpoints
 * for development and testing.
 */

class PMSConnector {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
  }

  buildBasicAuthHeader() {
    const username = typeof this.config?.username === "string" ? this.config.username : "";
    const password = typeof this.config?.password === "string" ? this.config.password : "";
    if (!username || !password) return {};
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${auth}` };
  }

  /**
   * Test the connection to the PMS
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      const { baseUrl, resortId } = this.config;
      const response = await fetch(`${baseUrl}/v1/properties/${resortId}`);
      
      if (!response.ok) {
        return { connected: false, error: response.statusText };
      }
      
      const data = await response.json();
      return { 
        connected: true, 
        property: data.property,
        provider: this.provider 
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Fetch reservation details by confirmation number
   * @param {string} confirmationNumber
   * @returns {Promise<Object>} Reservation data
   */
  async getReservation(confirmationNumber) {
    switch (this.provider) {
      case "opera":
        return this.getOperaReservation(confirmationNumber);
      case "mews":
        return this.getMewsReservation(confirmationNumber);
      case "cloudbeds":
        return this.getCloudbedsReservation(confirmationNumber);
      case "mock":
        return this.getMockReservation(confirmationNumber);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  /**
   * List reservations for the current hotel/property
   * @param {Object} filters
   * @returns {Promise<Array>} Normalized reservations
   */
  async listReservations(filters = {}) {
    switch (this.provider) {
      case "opera":
        return this.listOperaReservations(filters);
      case "mock":
        return this.listMockReservations(filters);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  /**
   * Create a reservation in the PMS
   * @param {Object} payload
   * @returns {Promise<Object>} Normalized reservation
   */
  async createReservation(payload) {
    switch (this.provider) {
      case "opera":
        return this.createOperaReservation(payload);
      case "mock":
        return this.createMockReservation(payload);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  /**
   * Update a reservation in the PMS
   * @param {string} reservationId
   * @param {Object} patch
   * @returns {Promise<Object>} Normalized reservation
   */
  async updateReservation(reservationId, patch) {
    switch (this.provider) {
      case "opera":
        return this.updateOperaReservation(reservationId, patch);
      case "mock":
        return this.updateMockReservation(reservationId, patch);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  /**
   * Fetch guest folio/bill
   * @param {string} reservationId
   * @returns {Promise<Object>} Folio data
   */
  async getFolio(reservationId) {
    switch (this.provider) {
      case "opera":
        return this.getOperaFolio(reservationId);
      case "mews":
        return this.getMewsFolio(reservationId);
      case "cloudbeds":
        return this.getCloudbedsFolio(reservationId);
      case "mock":
        return this.getMockFolio(reservationId);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  /**
   * Update guest profile
   * @param {string} guestId
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateGuestProfile(guestId, profileData) {
    switch (this.provider) {
      case "opera":
        return this.updateOperaGuestProfile(guestId, profileData);
      case "mews":
        return this.updateMewsGuestProfile(guestId, profileData);
      case "cloudbeds":
        return this.updateCloudbedsGuestProfile(guestId, profileData);
      case "mock":
        return this.updateMockGuestProfile(guestId, profileData);
      default:
        throw new Error(`Unsupported PMS provider: ${this.provider}`);
    }
  }

  // Opera Cloud Property API implementations
  async getOperaReservation(confirmationNumber) {
    const { baseUrl, resortId } = this.config;
    const headers = { ...this.buildBasicAuthHeader(), "Content-Type": "application/json" };

    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/reservations?confirmationNumber=${encodeURIComponent(confirmationNumber)}`,
      {
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservation = Array.isArray(data?.reservations) ? data.reservations[0] : data?.reservation ?? null;
    return reservation ? this.normalizeReservation(reservation, "opera") : null;
  }

  async getOperaFolio(reservationId) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/reservations/${reservationId}/folios`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    const data = await response.json();
    const folio = data.folio ?? data;
    return this.normalizeFolio(folio, "opera");
  }

  async updateOperaGuestProfile(guestId, profileData) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/profiles/${guestId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      }
    );

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async listOperaReservations(filters = {}) {
    const { baseUrl, resortId } = this.config;
    const url = new URL(`${baseUrl}/v1/hotels/${resortId}/reservations`);

    if (typeof filters.confirmationNumber === "string" && filters.confirmationNumber.trim()) {
      url.searchParams.set("confirmationNumber", filters.confirmationNumber.trim());
    }
    if (typeof filters.guestEmail === "string" && filters.guestEmail.trim()) {
      url.searchParams.set("guestEmail", filters.guestEmail.trim());
    }
    if (typeof filters.status === "string" && filters.status.trim()) {
      url.searchParams.set("status", filters.status.trim());
    }

    const response = await fetch(url.toString(), {
      headers: { ...this.buildBasicAuthHeader(), "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservations = Array.isArray(data?.reservations) ? data.reservations : [];
    return reservations.map((reservation) => this.normalizeReservation(reservation, "opera"));
  }

  async createOperaReservation(payload) {
    const { baseUrl, resortId } = this.config;
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/reservations`, {
      method: "POST",
      headers: { ...this.buildBasicAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {})
    });

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservation = data?.reservation ?? null;
    if (!reservation) return null;
    return this.normalizeReservation(reservation, "opera");
  }

  async updateOperaReservation(reservationId, patch) {
    const { baseUrl, resortId } = this.config;
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/reservations/${encodeURIComponent(reservationId)}`, {
      method: "PATCH",
      headers: { ...this.buildBasicAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(patch ?? {})
    });

    if (!response.ok) {
      throw new Error(`Opera API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservation = data?.reservation ?? null;
    if (!reservation) return null;
    return this.normalizeReservation(reservation, "opera");
  }

  // Mews API implementations
  async getMewsReservation(confirmationNumber) {
    const { baseUrl, clientToken, accessToken, enterpriseId } = this.config;

    const response = await fetch(`${baseUrl}/api/connector/v1/reservations/getAll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
        "Access-Token": accessToken,
      },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: "MyStay",
        EnterpriseIds: [enterpriseId],
        ReservationIds: [confirmationNumber],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeReservation(data, "mews");
  }

  async getMewsFolio(reservationId) {
    const { baseUrl, clientToken, accessToken, enterpriseId } = this.config;

    const response = await fetch(`${baseUrl}/api/connector/v1/bills/getAll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
        "Access-Token": accessToken,
      },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: "MyStay",
        EnterpriseId: enterpriseId,
        ReservationIds: [reservationId],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeFolio(data, "mews");
  }

  async updateMewsGuestProfile(guestId, profileData) {
    const { baseUrl, clientToken, accessToken } = this.config;

    const response = await fetch(`${baseUrl}/api/connector/v1/customers/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
        "Access-Token": accessToken,
      },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: "MyStay",
        CustomerId: guestId,
        ...profileData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mews API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Cloudbeds API implementations
  async getCloudbedsReservation(confirmationNumber) {
    const { baseUrl, clientId, clientSecret, propertyId } = this.config;

    // First, get access token
    const tokenResponse = await fetch(`${baseUrl}/api/v1.1/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Get reservation
    const response = await fetch(
      `${baseUrl}/api/v1.1/getReservation?propertyID=${propertyId}&reservationID=${confirmationNumber}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudbeds API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeReservation(data, "cloudbeds");
  }

  async getCloudbedsFolio(reservationId) {
    const { baseUrl, clientId, clientSecret, propertyId } = this.config;

    const tokenResponse = await fetch(`${baseUrl}/api/v1.1/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch(
      `${baseUrl}/api/v1.1/getFolio?propertyID=${propertyId}&reservationID=${reservationId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudbeds API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeFolio(data, "cloudbeds");
  }

  async updateCloudbedsGuestProfile(guestId, profileData) {
    const { baseUrl, clientId, clientSecret, propertyId } = this.config;

    const tokenResponse = await fetch(`${baseUrl}/api/v1.1/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch(`${baseUrl}/api/v1.1/putGuest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        propertyID: propertyId,
        guestID: guestId,
        ...profileData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudbeds API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Mock implementation for testing (uses Mock PMS server at localhost:4010)
  async getMockReservation(confirmationNumber) {
    const { baseUrl, resortId } = this.config;
    const url = `${baseUrl}/v1/hotels/${resortId}/reservations?confirmationNumber=${confirmationNumber}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const reservation = data.reservations?.[0];
    
    if (!reservation) {
      return null;
    }
    
    return this.normalizeReservation(reservation, "mock");
  }

  async listMockReservations(filters = {}) {
    const { baseUrl, resortId } = this.config;
    const url = new URL(`${baseUrl}/v1/hotels/${resortId}/reservations`);
    if (typeof filters.confirmationNumber === "string" && filters.confirmationNumber.trim()) {
      url.searchParams.set("confirmationNumber", filters.confirmationNumber.trim());
    }
    if (typeof filters.guestEmail === "string" && filters.guestEmail.trim()) {
      url.searchParams.set("guestEmail", filters.guestEmail.trim());
    }
    if (typeof filters.status === "string" && filters.status.trim()) {
      url.searchParams.set("status", filters.status.trim());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }
    const data = await response.json();
    const reservations = Array.isArray(data?.reservations) ? data.reservations : [];
    return reservations.map((reservation) => this.normalizeReservation(reservation, "mock"));
  }

  async createMockReservation(payload) {
    const { baseUrl, resortId } = this.config;
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {})
    });

    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservation = data?.reservation ?? null;
    return reservation ? this.normalizeReservation(reservation, "mock") : null;
  }

  async updateMockReservation(reservationId, patch) {
    const { baseUrl, resortId } = this.config;
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/reservations/${encodeURIComponent(reservationId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch ?? {})
    });

    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }

    const data = await response.json();
    const reservation = data?.reservation ?? null;
    return reservation ? this.normalizeReservation(reservation, "mock") : null;
  }

  async getMockFolio(reservationId) {
    const { baseUrl, resortId } = this.config;
    const url = `${baseUrl}/v1/hotels/${resortId}/reservations/${reservationId}/folios`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return this.normalizeFolio(data.folio, "mock");
  }

  async updateMockGuestProfile(guestId, profileData) {
    const { baseUrl, resortId } = this.config;
    const url = `${baseUrl}/v1/hotels/${resortId}/profiles/${guestId}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Mock PMS error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // =====================================================
  // ADDITIONAL METHODS (Available for all providers)
  // =====================================================

  /**
   * Get today's arrivals
   * @param {string} date - Optional date (defaults to today)
   * @returns {Promise<Array>} List of arriving reservations
   */
  async getArrivals(date) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const dateParam = date ? `?date=${date}` : "";
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/arrivals${dateParam}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.arrivals || [];
  }

  /**
   * Get today's departures
   * @param {string} date - Optional date (defaults to today)
   * @returns {Promise<Array>} List of departing reservations
   */
  async getDepartures(date) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const dateParam = date ? `?date=${date}` : "";
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/departures${dateParam}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.departures || [];
  }

  /**
   * Get room inventory/status
   * @param {Object} filters - Optional filters (status, floor)
   * @returns {Promise<Array>} List of rooms
   */
  async getRooms(filters = {}) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.floor) params.set("floor", filters.floor);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/rooms${queryString}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.rooms || [];
  }

  /**
   * Get room service menu
   * @returns {Promise<Object>} Menu data
   */
  async getMenu() {
    const { baseUrl, resortId } = this.config;
    
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/menu`);
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.menu || null;
  }

  /**
   * Get spa services catalog
   * @returns {Promise<Object>} Spa services data
   */
  async getSpaServices() {
    const { baseUrl, resortId } = this.config;
    
    const response = await fetch(`${baseUrl}/v1/hotels/${resortId}/spa/services`);
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.services || null;
  }

  /**
   * Get spa availability
   * @param {string} date - Date to check
   * @param {string} serviceId - Optional specific service
   * @returns {Promise<Array>} Available time slots
   */
  async getSpaAvailability(date, serviceId) {
    const { baseUrl, resortId } = this.config;
    
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (serviceId) params.set("serviceId", serviceId);
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/spa/availability?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.slots || [];
  }

  /**
   * Check in a guest
   * @param {string} reservationId - Reservation ID
   * @param {Object} options - Check-in options (roomNumber)
   * @returns {Promise<Object>} Check-in result
   */
  async checkIn(reservationId, options = {}) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/reservations/${reservationId}/checkin`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options)
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Check out a guest
   * @param {string} reservationId - Reservation ID
   * @returns {Promise<Object>} Check-out result with folio
   */
  async checkOut(reservationId) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/reservations/${reservationId}/checkout`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Add a charge to guest folio
   * @param {string} reservationId - Reservation ID
   * @param {Object} charge - Charge details
   * @returns {Promise<Object>} Updated folio
   */
  async addCharge(reservationId, charge) {
    const { baseUrl, resortId, username, password } = this.config;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    
    const response = await fetch(
      `${baseUrl}/v1/hotels/${resortId}/reservations/${reservationId}/charges`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(charge)
      }
    );
    
    if (!response.ok) {
      throw new Error(`PMS API error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Normalization helpers
  normalizeReservation(data, provider) {
    // Transform provider-specific data to standard format
    const guest = data.guest || {};
    const guestFirstName = data.guestFirstName ?? guest.firstName ?? null;
    const guestLastName = data.guestLastName ?? guest.lastName ?? null;
    return {
      id: data.id || data.reservationId,
      confirmationNumber: data.confirmationNumber,
      guestFirstName,
      guestLastName,
      guestName: data.guestName || `${guest.firstName || ""} ${guest.lastName || ""}`.trim() || guest.name,
      guestEmail: data.guestEmail || guest.email,
      guestPhone: data.guestPhone || guest.phone,
      checkInDate: data.checkInDate || data.arrival,
      checkOutDate: data.checkOutDate || data.departure,
      nights: data.nights,
      roomType: data.roomType || data.room?.type,
      roomNumber: data.roomNumber || data.room?.number,
      roomRate: data.roomRate,
      totalAmount: data.totalAmount,
      currency: data.currency || "EUR",
      status: data.status,
      adults: data.adults || data.numberOfGuests || 1,
      children: data.children || 0,
      specialRequests: data.specialRequests,
      packages: data.packages || [],
      source: data.source || "direct",
      guestId: data.guestId,
      checkedInAt: data.checkedInAt,
      checkedOutAt: data.checkedOutAt,
      createdAt: data.createdAt,
      provider,
    };
  }

  normalizeFolio(data, provider) {
    if (!data) {
      return {
        reservationId: null,
        charges: [],
        payments: [],
        balance: 0,
        currency: "EUR",
        provider
      };
    }
    
    return {
      reservationId: data.reservationId,
      charges: (data.charges || []).map(c => ({
        id: c.id,
        date: c.date,
        description: c.description,
        amount: c.amount,
        category: c.category
      })),
      payments: (data.payments || []).map(p => ({
        id: p.id,
        date: p.date,
        description: p.description,
        amount: p.amount,
        method: p.method
      })),
      balance: data.balance || 0,
      currency: data.currency || "EUR",
      provider,
    };
  }
}

/**
 * Create a PMS connector for a hotel based on its configuration
 * @param {Object} hotelIntegration - Hotel integration config from database
 * @returns {PMSConnector|null}
 */
export function createPMSConnector(hotelIntegration) {
  if (!hotelIntegration?.pmsProvider || hotelIntegration.pmsProvider === "none") {
    return null;
  }
  
  // Parse config if it's a string
  const config = typeof hotelIntegration.pmsConfig === "string"
    ? JSON.parse(hotelIntegration.pmsConfig)
    : hotelIntegration.pmsConfig;
  
  return new PMSConnector(hotelIntegration.pmsProvider, config);
}

export default PMSConnector;

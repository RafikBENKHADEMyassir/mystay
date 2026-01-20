// backend/src/integrations/spa-connector.mjs
// Spa Booker and wellness facility integration

/**
 * Spa connector for Spa Booker, Mindbody, and generic wellness booking systems
 * Handles service catalog, practitioner schedules, and appointment bookings
 */

class SpaConnector {
  constructor(config) {
    this.config = config;
    this.provider = config.provider; // 'spabooker', 'mindbody', 'generic'
    this.apiKey = config.apiKey;
    this.siteId = config.siteId;
    this.baseUrl = typeof config.baseUrl === "string" && config.baseUrl.trim() ? config.baseUrl.trim() : this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.provider) {
      case "spabooker":
        return "https://api.spabooker.com/v3";
      case "mindbody":
        return "https://api.mindbodyonline.com/public/v6";
      case "generic":
        return this.config?.customUrl || "https://api.spa-booking.example.com";
      default:
        throw new Error(`Unknown spa provider: ${this.provider}`);
    }
  }

  /**
   * Get available spa services/treatments
   * @param {Object} options - { category }
   * @returns {Promise<Object>} Service catalog
   */
  async getServices({ category = null } = {}) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);

    const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/services?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Services fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeServices(data);
  }

  /**
   * Get available practitioners/staff
   * @param {Object} options - { serviceId }
   * @returns {Promise<Object>} List of practitioners
   */
  async getPractitioners({ serviceId = null } = {}) {
    const params = new URLSearchParams();
    if (serviceId) params.append("service_id", serviceId);

    const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/staff?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Practitioners fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizePractitioners(data);
  }

  /**
   * Get available appointment slots
   * @param {Object} params - { serviceId, practitionerId, date, duration }
   * @returns {Promise<Object>} Available time slots
   */
  async getAvailability({ serviceId, practitionerId = null, date, duration = 60 }) {
    const params = new URLSearchParams({
      service_id: serviceId,
      date,
      duration: duration.toString(),
    });

    if (practitionerId) {
      params.append("staff_id", practitionerId);
    }

    const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/availability?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Availability fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeAvailability(data);
  }

  /**
   * Create spa appointment/booking
   * @param {Object} params - { serviceId, practitionerId, date, time, guestName, guestEmail, guestPhone, specialRequests }
   * @returns {Promise<Object>} Booking confirmation
   */
  async createBooking({
    serviceId,
    practitionerId,
    date,
    time,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests = ""
  }) {
    const payload = this.buildBookingPayload({
      serviceId,
      practitionerId,
      date,
      time,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    });

    const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/appointments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Booking failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeBooking(data);
  }

  /**
   * Update existing booking
   * @param {string} bookingId
   * @param {Object} updates - { date, time, practitionerId, specialRequests }
   * @returns {Promise<Object>}
   */
  async updateBooking(bookingId, updates) {
    const payload = this.buildBookingUpdatePayload(updates);

    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/appointments/${bookingId}`,
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
   * Cancel spa appointment
   * @param {string} bookingId
   * @returns {Promise<Object>}
   */
  async cancelBooking(bookingId) {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/appointments/${bookingId}`,
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

    return { success: true, bookingId };
  }

  /**
   * Get practitioner schedule for a date range
   * @param {Object} params - { practitionerId, startDate, endDate }
   * @returns {Promise<Object>} Schedule with bookings
   */
  async getPractitionerSchedule({ practitionerId, startDate, endDate }) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/staff/${practitionerId}/schedule?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Schedule fetch failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get booking details
   * @param {string} bookingId
   * @returns {Promise<Object>}
   */
  async getBooking(bookingId) {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/appointments/${bookingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Booking fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeBooking(data);
  }

  /**
   * Submit post-service feedback
   * @param {Object} params - { bookingId, rating, comment, practitionerId }
   * @returns {Promise<Object>}
   */
  async submitFeedback({ bookingId, rating, comment, practitionerId }) {
    const payload = {
      appointment_id: bookingId,
      rating,
      comment,
      staff_id: practitionerId,
    };

    const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Provider-specific payload builders
  buildBookingPayload(params) {
    const base = {
      site_id: this.siteId,
      service_id: params.serviceId,
      staff_id: params.practitionerId,
      date: params.date,
      time: params.time,
      client: {
        name: params.guestName,
        email: params.guestEmail,
        phone: params.guestPhone,
      },
      notes: params.specialRequests,
    };

    switch (this.provider) {
      case "spabooker":
        return {
          ...base,
          send_confirmation: true,
          source: "hotel_app",
        };
      case "mindbody":
        return {
          ...base,
          send_email: true,
          test: false,
        };
      default:
        return base;
    }
  }

  buildBookingUpdatePayload(updates) {
    return updates;
  }

  // Data normalization helpers
  normalizeServices(data) {
    const services = data.services || data.SessionTypes || data.items || [];
    return services.map((service) => ({
      id: service.id || service.Id,
      name: service.name || service.Name,
      description: service.description || service.Description || "",
      duration: service.duration || service.DefaultTimeLength || 60,
      price: service.price || service.OnlinePrice || service.Price || 0,
      category: service.category || service.ProgramId || "general",
    }));
  }

  normalizePractitioners(data) {
    const staff = data.staff || data.StaffMembers || data.practitioners || [];
    return staff.map((practitioner) => ({
      id: practitioner.id || practitioner.Id,
      name: practitioner.name || practitioner.Name || practitioner.DisplayName,
      bio: practitioner.bio || practitioner.Bio || "",
      imageUrl: practitioner.image_url || practitioner.ImageURL || null,
      specialties: practitioner.specialties || [],
    }));
  }

  normalizeAvailability(data) {
    return {
      date: data.date,
      slots: data.slots || data.AvailableTimes || [],
    };
  }

  normalizeBooking(data) {
    return {
      id: data.id || data.appointment_id || data.Id,
      confirmationNumber: data.confirmation || data.ConfirmationCode,
      status: data.status || data.Status,
      serviceId: data.service_id || data.SessionTypeId,
      serviceName: data.service_name || data.SessionTypeName,
      practitionerId: data.staff_id || data.StaffId,
      practitionerName: data.staff_name || data.StaffName,
      date: data.date || data.StartDate,
      time: data.time || data.StartTime,
      duration: data.duration || data.Duration,
      guest: {
        name: data.client?.name || data.ClientName,
        email: data.client?.email || data.ClientEmail,
        phone: data.client?.phone || data.ClientPhone,
      },
    };
  }
}

export { SpaConnector };

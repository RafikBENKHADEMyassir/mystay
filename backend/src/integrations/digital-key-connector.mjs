// backend/src/integrations/digital-key-connector.mjs
// Digital key integration for mobile key access

/**
 * Digital key connector for various providers
 * Supports mobile key issuance, revocation, and access management
 */

class DigitalKeyConnector {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Issue digital key to guest
   * @param {Object} params - { guestId, roomNumber, checkIn, checkOut, guestEmail }
   * @returns {Promise<Object>} Key details
   */
  async issueKey({ guestId, roomNumber, checkIn, checkOut, guestEmail }) {
    switch (this.provider) {
      case "alliants":
        return this.issueAlliantsKey({ guestId, roomNumber, checkIn, checkOut, guestEmail });
      case "openkey":
        return this.issueOpenKey({ guestId, roomNumber, checkIn, checkOut, guestEmail });
      case "none":
        return this.issueMockKey({ guestId, roomNumber, checkIn, checkOut, guestEmail });
      default:
        throw new Error(`Unsupported digital key provider: ${this.provider}`);
    }
  }

  /**
   * Revoke digital key
   * @param {string} keyId
   * @returns {Promise<Object>}
   */
  async revokeKey(keyId) {
    switch (this.provider) {
      case "alliants":
        return this.revokeAlliantsKey(keyId);
      case "openkey":
        return this.revokeOpenKey(keyId);
      case "none":
        return this.revokeMockKey(keyId);
      default:
        throw new Error(`Unsupported digital key provider: ${this.provider}`);
    }
  }

  /**
   * Extend key validity
   * @param {string} keyId
   * @param {string} newCheckOut - New checkout date
   * @returns {Promise<Object>}
   */
  async extendKey(keyId, newCheckOut) {
    switch (this.provider) {
      case "alliants":
        return this.extendAlliantsKey(keyId, newCheckOut);
      case "openkey":
        return this.extendOpenKey(keyId, newCheckOut);
      case "none":
        return this.extendMockKey(keyId, newCheckOut);
      default:
        throw new Error(`Unsupported digital key provider: ${this.provider}`);
    }
  }

  /**
   * Get key status
   * @param {string} keyId
   * @returns {Promise<Object>}
   */
  async getKeyStatus(keyId) {
    switch (this.provider) {
      case "alliants":
        return this.getAlliantsKeyStatus(keyId);
      case "openkey":
        return this.getOpenKeyStatus(keyId);
      case "none":
        return this.getMockKeyStatus(keyId);
      default:
        throw new Error(`Unsupported digital key provider: ${this.provider}`);
    }
  }

  // Alliants implementation
  async issueAlliantsKey({ guestId, roomNumber, checkIn, checkOut, guestEmail }) {
    const { baseUrl, propertyId, apiKey } = this.config;

    const response = await fetch(`${baseUrl}/api/v1/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        propertyId,
        guestId,
        roomNumber,
        validFrom: checkIn,
        validTo: checkOut,
        guestEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alliants API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async revokeAlliantsKey(keyId) {
    const { baseUrl, apiKey } = this.config;

    const response = await fetch(`${baseUrl}/api/v1/keys/${keyId}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Alliants API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async extendAlliantsKey(keyId, newCheckOut) {
    const { baseUrl, apiKey } = this.config;

    const response = await fetch(`${baseUrl}/api/v1/keys/${keyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        validTo: newCheckOut,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alliants API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAlliantsKeyStatus(keyId) {
    const { baseUrl, apiKey } = this.config;

    const response = await fetch(`${baseUrl}/api/v1/keys/${keyId}`, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Alliants API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // OpenKey implementation
  async issueOpenKey({ guestId, roomNumber, checkIn, checkOut, guestEmail }) {
    const { baseUrl, clientId, clientSecret, propertyId } = this.config;

    // Get access token
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Issue key
    const response = await fetch(`${baseUrl}/v1/keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        property_id: propertyId,
        guest_id: guestId,
        room_number: roomNumber,
        start_date: checkIn,
        end_date: checkOut,
        email: guestEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenKey API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async revokeOpenKey(keyId) {
    const { baseUrl, clientId, clientSecret } = this.config;

    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch(`${baseUrl}/v1/keys/${keyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenKey API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async extendOpenKey(keyId, newCheckOut) {
    const { baseUrl, clientId, clientSecret } = this.config;

    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch(`${baseUrl}/v1/keys/${keyId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_date: newCheckOut,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenKey API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getOpenKeyStatus(keyId) {
    const { baseUrl, clientId, clientSecret } = this.config;

    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch(`${baseUrl}/v1/keys/${keyId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenKey API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Mock implementation for testing
  async issueMockKey({ guestId, roomNumber, checkIn, checkOut, guestEmail }) {
    return {
      keyId: `KEY-${Date.now()}`,
      guestId,
      roomNumber,
      validFrom: checkIn,
      validTo: checkOut,
      status: "active",
      issuedAt: new Date().toISOString(),
      email: guestEmail,
    };
  }

  async revokeMockKey(keyId) {
    return {
      keyId,
      status: "revoked",
      revokedAt: new Date().toISOString(),
    };
  }

  async extendMockKey(keyId, newCheckOut) {
    return {
      keyId,
      validTo: newCheckOut,
      status: "active",
      updatedAt: new Date().toISOString(),
    };
  }

  async getMockKeyStatus(keyId) {
    return {
      keyId,
      status: "active",
      roomNumber: "305",
      validFrom: "2026-01-15T14:00:00Z",
      validTo: "2026-01-20T11:00:00Z",
    };
  }
}

export default DigitalKeyConnector;

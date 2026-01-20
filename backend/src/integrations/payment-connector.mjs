// backend/src/integrations/payment-connector.mjs
// Stripe payment integration for holds, charges, and tips

/**
 * Payment connector for Stripe integration
 * Handles authorization holds, charges, refunds, and tips
 */

class PaymentConnector {
  constructor(config) {
    this.stripeSecretKey = config.stripeSecretKey;
    this.baseUrl = "https://api.stripe.com/v1";
  }

  /**
   * Create authorization hold (pre-authorization)
   * @param {Object} params - { amount, currency, customerId, description }
   * @returns {Promise<Object>} Payment intent
   */
  async createAuthorizationHold({ amount, currency = "usd", customerId, description }) {
    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency,
        customer: customerId,
        description: description || "Hotel authorization hold",
        capture_method: "manual", // Hold funds without capturing
        confirm: "true",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Capture previously authorized hold
   * @param {string} paymentIntentId
   * @param {number} amountToCapture - Amount to capture (can be less than hold)
   * @returns {Promise<Object>}
   */
  async captureHold(paymentIntentId, amountToCapture = null) {
    const body = new URLSearchParams();
    if (amountToCapture) {
      body.append("amount_to_capture", Math.round(amountToCapture * 100));
    }

    const response = await fetch(
      `${this.baseUrl}/payment_intents/${paymentIntentId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel authorization hold
   * @param {string} paymentIntentId
   * @returns {Promise<Object>}
   */
  async cancelHold(paymentIntentId) {
    const response = await fetch(
      `${this.baseUrl}/payment_intents/${paymentIntentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create immediate charge (no hold)
   * @param {Object} params - { amount, currency, customerId, description, metadata }
   * @returns {Promise<Object>}
   */
  async createCharge({ amount, currency = "usd", customerId, description, metadata = {} }) {
    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100),
        currency,
        customer: customerId,
        description: description || "Hotel service charge",
        capture_method: "automatic",
        confirm: "true",
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          acc[`metadata[${key}]`] = value;
          return acc;
        }, {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Process tip payment
   * @param {Object} params - { amount, currency, customerId, staffName, department }
   * @returns {Promise<Object>}
   */
  async processTip({ amount, currency = "usd", customerId, staffName, department }) {
    return await this.createCharge({
      amount,
      currency,
      customerId,
      description: `Tip for ${staffName} (${department})`,
      metadata: {
        type: "tip",
        staff_name: staffName,
        department,
      },
    });
  }

  /**
   * Create refund
   * @param {string} paymentIntentId
   * @param {number} amount - Optional partial refund amount
   * @param {string} reason - Optional refund reason
   * @returns {Promise<Object>}
   */
  async createRefund(paymentIntentId, amount = null, reason = null) {
    const body = new URLSearchParams({
      payment_intent: paymentIntentId,
    });

    if (amount) {
      body.append("amount", Math.round(amount * 100));
    }

    if (reason) {
      body.append("reason", reason);
    }

    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create customer in Stripe
   * @param {Object} params - { email, name, phone, metadata }
   * @returns {Promise<Object>}
   */
  async createCustomer({ email, name, phone, metadata = {} }) {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email,
        name,
        phone,
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          acc[`metadata[${key}]`] = value;
          return acc;
        }, {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Attach payment method to customer
   * @param {string} paymentMethodId
   * @param {string} customerId
   * @returns {Promise<Object>}
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    const response = await fetch(
      `${this.baseUrl}/payment_methods/${paymentMethodId}/attach`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get payment intent details
   * @param {string} paymentIntentId
   * @returns {Promise<Object>}
   */
  async getPaymentIntent(paymentIntentId) {
    const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
      headers: {
        Authorization: `Bearer ${this.stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List customer payment methods
   * @param {string} customerId
   * @returns {Promise<Object>}
   */
  async listPaymentMethods(customerId) {
    const response = await fetch(
      `${this.baseUrl}/payment_methods?customer=${customerId}&type=card`,
      {
        headers: {
          Authorization: `Bearer ${this.stripeSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }
}

export default PaymentConnector;

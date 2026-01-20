// backend/src/integrations/integration-manager.mjs
// Central manager for all external integrations

import PMSConnector from "./pms-connector.mjs";
import PaymentConnector from "./payment-connector.mjs";
import DigitalKeyConnector from "./digital-key-connector.mjs";
import { SpaConnector } from "./spa-connector.mjs";
import OCRService from "./ocr-service.mjs";
import AIConcierge from "./ai-concierge.mjs";

/**
 * Integration Manager - Central hub for all external service integrations
 * Manages PMS, Payment, Digital Keys, OCR, and AI services
 */

class IntegrationManager {
  constructor(config) {
    this.config = config;
    this.pms = null;
    this.payment = null;
    this.digitalKey = null;
    this.spa = null;
    this.ocr = null;
    this.aiConcierge = null;
  }

  /**
   * Initialize PMS connector
   * @param {string} provider - "opera", "mews", "cloudbeds", "mock"
   * @param {Object} pmsConfig - Provider-specific configuration
   */
  initPMS(provider, pmsConfig) {
    this.pms = new PMSConnector(provider, pmsConfig);
    // PMS connector initialized
    return this.pms;
  }

  /**
   * Initialize Spa connector
   * @param {string} provider - "spabooker", "mindbody", "generic"
   * @param {Object} spaConfig - Provider-specific configuration
   */
  initSpa(provider, spaConfig) {
    this.spa = new SpaConnector({ provider, ...(spaConfig ?? {}) });
    return this.spa;
  }

  /**
   * Initialize payment connector
   * @param {Object} paymentConfig - Stripe configuration
   */
  initPayment(paymentConfig) {
    this.payment = new PaymentConnector(paymentConfig);
    // Payment connector initialized
    return this.payment;
  }

  /**
   * Initialize digital key connector
   * @param {string} provider - "alliants", "openkey", "none"
   * @param {Object} keyConfig - Provider-specific configuration
   */
  initDigitalKey(provider, keyConfig) {
    this.digitalKey = new DigitalKeyConnector(provider, keyConfig);
    // Digital key connector initialized
    return this.digitalKey;
  }

  /**
   * Initialize OCR service
   * @param {Object} ocrConfig - OCR provider configuration
   */
  initOCR(ocrConfig) {
    this.ocr = new OCRService(ocrConfig);
    // OCR service initialized
    return this.ocr;
  }

  /**
   * Initialize AI concierge
   * @param {Object} aiConfig - OpenAI configuration and hotel info
   */
  initAIConcierge(aiConfig) {
    this.aiConcierge = new AIConcierge(aiConfig);
    // AI Concierge initialized
    return this.aiConcierge;
  }

  /**
   * Initialize all integrations from environment config
   */
  initializeAll() {
    const env = process.env;

    // PMS Integration
    if (env.PMS_PROVIDER) {
      const pmsConfig = {
        baseUrl: env.PMS_BASE_URL,
        resortId: env.PMS_RESORT_ID,
        username: env.PMS_USERNAME,
        password: env.PMS_PASSWORD,
        clientToken: env.PMS_CLIENT_TOKEN,
        accessToken: env.PMS_ACCESS_TOKEN,
        enterpriseId: env.PMS_ENTERPRISE_ID,
        clientId: env.PMS_CLIENT_ID,
        clientSecret: env.PMS_CLIENT_SECRET,
        propertyId: env.PMS_PROPERTY_ID,
      };
      this.initPMS(env.PMS_PROVIDER, pmsConfig);
    }

    // Payment Integration
    if (env.STRIPE_SECRET_KEY) {
      this.initPayment({
        stripeSecretKey: env.STRIPE_SECRET_KEY,
      });
    }

    // Digital Key Integration
    if (env.DIGITAL_KEY_PROVIDER && env.DIGITAL_KEY_PROVIDER !== "none") {
      const keyConfig = {
        baseUrl: env.DIGITAL_KEY_BASE_URL,
        propertyId: env.DIGITAL_KEY_PROPERTY_ID,
        apiKey: env.DIGITAL_KEY_API_KEY,
        clientId: env.DIGITAL_KEY_CLIENT_ID,
        clientSecret: env.DIGITAL_KEY_CLIENT_SECRET,
      };
      this.initDigitalKey(env.DIGITAL_KEY_PROVIDER, keyConfig);
    }

    // Spa Integration
    if (env.SPA_PROVIDER && env.SPA_PROVIDER !== "none") {
      const spaConfig = {
        baseUrl: env.SPA_BASE_URL,
        siteId: env.SPA_SITE_ID,
        apiKey: env.SPA_API_KEY
      };
      this.initSpa(env.SPA_PROVIDER, spaConfig);
    }

    // OCR Service
    if (env.OCR_PROVIDER) {
      this.initOCR({
        provider: env.OCR_PROVIDER,
        apiKey: env.OCR_API_KEY,
        baseUrl: env.OCR_BASE_URL,
      });
    }

    // AI Concierge
    if (env.OPENAI_API_KEY) {
      this.initAIConcierge({
        openaiApiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || "gpt-4",
        hotelInfo: {
          name: env.HOTEL_NAME || "MyStay Hotel",
          description: env.HOTEL_DESCRIPTION,
          location: env.HOTEL_LOCATION,
          amenities: env.HOTEL_AMENITIES?.split(",") || [],
        },
      });
    }

    // All integrations initialized
  }

  /**
   * Get PMS connector
   */
  getPMS() {
    if (this.pms) return this.pms;

    const provider = this.config?.pms?.provider ?? process.env.PMS_PROVIDER ?? "mock";
    const pmsConfig = this.config?.pms?.config ?? this.config?.pmsConfig ?? {};

    this.initPMS(provider, pmsConfig);
    return this.pms;
  }

  /**
   * Get payment connector
   */
  getPayment() {
    if (!this.payment) {
      throw new Error("Payment connector not initialized");
    }
    return this.payment;
  }

  /**
   * Get digital key connector
   */
  getDigitalKey() {
    if (this.digitalKey) return this.digitalKey;

    const provider = this.config?.digitalKey?.provider ?? process.env.DIGITAL_KEY_PROVIDER ?? "none";
    const keyConfig = this.config?.digitalKey?.config ?? this.config?.digitalKeyConfig ?? {};

    this.initDigitalKey(provider, keyConfig);
    return this.digitalKey;
  }

  /**
   * Get spa connector (lazy init from hotel config / env)
   */
  getSpa() {
    if (this.spa) return this.spa;

    const provider = this.config?.spa?.provider ?? process.env.SPA_PROVIDER ?? "none";
    if (!provider || provider === "none") {
      throw new Error("spa_not_configured");
    }
    const spaConfig = this.config?.spa?.config ?? this.config?.spaConfig ?? {};
    this.initSpa(provider, spaConfig);
    return this.spa;
  }

  /**
   * Get OCR service
   */
  getOCR() {
    if (!this.ocr) {
      throw new Error("OCR service not initialized");
    }
    return this.ocr;
  }

  /**
   * Get AI concierge
   */
  getAIConcierge() {
    if (!this.aiConcierge) {
      throw new Error("AI concierge not initialized");
    }
    return this.aiConcierge;
  }

  /**
   * Check integration health
   */
  async healthCheck() {
    const health = {
      pms: !!this.pms,
      payment: !!this.payment,
      digitalKey: !!this.digitalKey,
      spa: !!this.spa,
      ocr: !!this.ocr,
      aiConcierge: !!this.aiConcierge,
      timestamp: new Date().toISOString(),
    };

    return health;
  }
}

// Singleton instance
let integrationManager = null;

export function getIntegrationManager(config = {}) {
  if (!integrationManager) {
    integrationManager = new IntegrationManager(config);
  }
  return integrationManager;
}

export { IntegrationManager };
export default IntegrationManager;

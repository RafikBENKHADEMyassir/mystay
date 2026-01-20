export const pmsProviders = ["mock", "opera", "mews", "cloudbeds"];
export const digitalKeyProviders = ["none", "alliants", "openkey"];
export const spaProviders = ["none", "spabooker"];

export const pmsProviderConfigTemplates = {
  mock: { propertyId: "DEMO-PROPERTY" },
  opera: {
    baseUrl: "http://localhost:4010",
    resortId: "RESORT_CODE",
    username: "OPERA",
    password: "OPERA"
  },
  mews: {
    baseUrl: "https://api.mews.com",
    clientToken: "MEWS_CLIENT_TOKEN",
    accessToken: "MEWS_ACCESS_TOKEN",
    enterpriseId: "MEWS_ENTERPRISE_ID"
  },
  cloudbeds: {
    baseUrl: "https://api.cloudbeds.com",
    clientId: "CLOUDBEDS_CLIENT_ID",
    clientSecret: "CLOUDBEDS_CLIENT_SECRET",
    propertyId: "CLOUDBEDS_PROPERTY_ID"
  }
};

export const digitalKeyProviderConfigTemplates = {
  none: {},
  alliants: {
    baseUrl: "https://digitalkey.example.com",
    propertyId: "ALLIANTS_PROPERTY_ID",
    apiKey: "ALLIANTS_API_KEY"
  },
  openkey: {
    baseUrl: "https://api.openkey.co",
    clientId: "OPENKEY_CLIENT_ID",
    clientSecret: "OPENKEY_CLIENT_SECRET",
    propertyId: "OPENKEY_PROPERTY_ID"
  }
};

export const spaProviderConfigTemplates = {
  none: {},
  spabooker: {
    baseUrl: "http://localhost:4011/v3",
    siteId: "SITE_ID",
    apiKey: "SPA_API_KEY"
  }
};

export function isPmsProvider(value) {
  return pmsProviders.includes(value);
}

export function isDigitalKeyProvider(value) {
  return digitalKeyProviders.includes(value);
}

export function isSpaProvider(value) {
  return spaProviders.includes(value);
}

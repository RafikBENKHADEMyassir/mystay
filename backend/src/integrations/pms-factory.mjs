import PMSConnector from "./pms-connector.mjs";
import { getHotelIntegrations } from "./hotel-integrations.mjs";

/**
 * Create a PMS connector configured from the hotel's DB settings.
 * Falls back to `mock` if the hotel has no PMS provider configured.
 */
export async function createPMSConnectorForHotel(hotelId) {
  const integrations = await getHotelIntegrations(hotelId);
  const provider = integrations.pms.provider;
  const config = integrations.pms.config ?? {};

  if (!provider || provider === "none") {
    return new PMSConnector("mock", { baseUrl: "http://localhost:4010", resortId: "MOCK" });
  }

  return new PMSConnector(provider, config);
}

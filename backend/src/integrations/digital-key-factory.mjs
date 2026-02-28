import DigitalKeyConnector from "./digital-key-connector.mjs";
import { getHotelIntegrations } from "./hotel-integrations.mjs";

/**
 * Create a digital key connector configured from the hotel's DB settings.
 * Returns null if the hotel has no digital key provider configured.
 */
export async function createDigitalKeyConnectorForHotel(hotelId) {
  const integrations = await getHotelIntegrations(hotelId);
  const provider = integrations.digitalKey.provider;
  const config = integrations.digitalKey.config ?? {};

  if (!provider || provider === "none") {
    return null;
  }

  return new DigitalKeyConnector(provider, config);
}

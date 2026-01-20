import { query } from "../db/postgres.mjs";
import { isDigitalKeyProvider, isPmsProvider, isSpaProvider } from "./options.mjs";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mergeConfig(existing, patch) {
  if (!patch || typeof patch !== "object") return existing;

  const next = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (value === "") continue;
    if (value === null) {
      delete next[key];
      continue;
    }
    next[key] = value;
  }
  return next;
}

function ensurePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

export async function listHotels() {
  return await query(
    `
      SELECT
        id,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotels
      ORDER BY name ASC
    `
  );
}

export async function getHotelById(hotelId) {
  const rows = await query(
    `
      SELECT
        id,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotels
      WHERE id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  return rows[0] ?? null;
}

async function ensureIntegrationRow(hotelId) {
  const rows = await query(
    `
      SELECT
        hotel_id AS "hotelId",
        pms_provider AS "pmsProvider",
        pms_config AS "pmsConfig",
        digital_key_provider AS "digitalKeyProvider",
        digital_key_config AS "digitalKeyConfig",
        spa_provider AS "spaProvider",
        spa_config AS "spaConfig",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotel_integrations
      WHERE hotel_id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  if (rows[0]) return rows[0];

  await query(
    `
      INSERT INTO hotel_integrations (hotel_id)
      VALUES ($1)
      ON CONFLICT (hotel_id) DO NOTHING
    `,
    [hotelId]
  );

  const created = await query(
    `
      SELECT
        hotel_id AS "hotelId",
        pms_provider AS "pmsProvider",
        pms_config AS "pmsConfig",
        digital_key_provider AS "digitalKeyProvider",
        digital_key_config AS "digitalKeyConfig",
        spa_provider AS "spaProvider",
        spa_config AS "spaConfig",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotel_integrations
      WHERE hotel_id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  return created[0];
}

export async function getHotelIntegrations(hotelId) {
  const row = await ensureIntegrationRow(hotelId);

  return {
    hotelId: row.hotelId,
    pms: {
      provider: row.pmsProvider,
      config: safeJsonParse(row.pmsConfig, {})
    },
    digitalKey: {
      provider: row.digitalKeyProvider,
      config: safeJsonParse(row.digitalKeyConfig, {})
    },
    spa: {
      provider: row.spaProvider,
      config: safeJsonParse(row.spaConfig, {})
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function updateHotelPmsIntegration({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelIntegrations(hotelId);

  if (provider !== undefined && !isPmsProvider(provider)) {
    throw new Error("invalid_pms_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_pms_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.pms.config, configPatch);
  const nextProvider = provider ?? existing.pms.provider;

  const rows = await query(
    `
      UPDATE hotel_integrations
      SET
        pms_provider = $1,
        pms_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        pms_provider AS provider,
        pms_config AS config,
        updated_at AS "updatedAt"
    `,
    [nextProvider, JSON.stringify(nextConfig), hotelId]
  );

  const row = rows[0];
  return {
    hotelId: row.hotelId,
    provider: row.provider,
    config: safeJsonParse(row.config, {}),
    updatedAt: row.updatedAt
  };
}

export async function updateHotelDigitalKeyIntegration({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelIntegrations(hotelId);

  if (provider !== undefined && !isDigitalKeyProvider(provider)) {
    throw new Error("invalid_digital_key_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_digital_key_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.digitalKey.config, configPatch);
  const nextProvider = provider ?? existing.digitalKey.provider;

  const rows = await query(
    `
      UPDATE hotel_integrations
      SET
        digital_key_provider = $1,
        digital_key_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        digital_key_provider AS provider,
        digital_key_config AS config,
        updated_at AS "updatedAt"
    `,
    [nextProvider, JSON.stringify(nextConfig), hotelId]
  );

  const row = rows[0];
  return {
    hotelId: row.hotelId,
    provider: row.provider,
    config: safeJsonParse(row.config, {}),
    updatedAt: row.updatedAt
  };
}

export async function updateHotelSpaIntegration({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelIntegrations(hotelId);

  if (provider !== undefined && !isSpaProvider(provider)) {
    throw new Error("invalid_spa_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_spa_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.spa.config, configPatch);
  const nextProvider = provider ?? existing.spa.provider;

  const rows = await query(
    `
      UPDATE hotel_integrations
      SET
        spa_provider = $1,
        spa_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        spa_provider AS provider,
        spa_config AS config,
        updated_at AS "updatedAt"
    `,
    [nextProvider, JSON.stringify(nextConfig), hotelId]
  );

  const row = rows[0];
  return {
    hotelId: row.hotelId,
    provider: row.provider,
    config: safeJsonParse(row.config, {}),
    updatedAt: row.updatedAt
  };
}

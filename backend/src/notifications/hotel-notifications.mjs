import { query } from "../db/postgres.mjs";
import { isEmailProvider, isPushProvider, isSmsProvider } from "./options.mjs";

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

async function ensureNotificationRow(hotelId) {
  const rows = await query(
    `
      SELECT
        hotel_id AS "hotelId",
        email_provider AS "emailProvider",
        email_config AS "emailConfig",
        sms_provider AS "smsProvider",
        sms_config AS "smsConfig",
        push_provider AS "pushProvider",
        push_config AS "pushConfig",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotel_notifications
      WHERE hotel_id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  if (rows[0]) return rows[0];

  await query(
    `
      INSERT INTO hotel_notifications (hotel_id)
      VALUES ($1)
      ON CONFLICT (hotel_id) DO NOTHING
    `,
    [hotelId]
  );

  const created = await query(
    `
      SELECT
        hotel_id AS "hotelId",
        email_provider AS "emailProvider",
        email_config AS "emailConfig",
        sms_provider AS "smsProvider",
        sms_config AS "smsConfig",
        push_provider AS "pushProvider",
        push_config AS "pushConfig",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM hotel_notifications
      WHERE hotel_id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  return created[0];
}

export async function getHotelNotifications(hotelId) {
  const row = await ensureNotificationRow(hotelId);

  return {
    hotelId: row.hotelId,
    email: {
      provider: row.emailProvider,
      config: safeJsonParse(row.emailConfig, {})
    },
    sms: {
      provider: row.smsProvider,
      config: safeJsonParse(row.smsConfig, {})
    },
    push: {
      provider: row.pushProvider,
      config: safeJsonParse(row.pushConfig, {})
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function updateHotelEmailNotifications({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelNotifications(hotelId);

  if (provider !== undefined && !isEmailProvider(provider)) {
    throw new Error("invalid_email_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_email_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.email.config, configPatch);
  const nextProvider = provider ?? existing.email.provider;

  const rows = await query(
    `
      UPDATE hotel_notifications
      SET
        email_provider = $1,
        email_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        email_provider AS provider,
        email_config AS config,
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

export async function updateHotelSmsNotifications({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelNotifications(hotelId);

  if (provider !== undefined && !isSmsProvider(provider)) {
    throw new Error("invalid_sms_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_sms_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.sms.config, configPatch);
  const nextProvider = provider ?? existing.sms.provider;

  const rows = await query(
    `
      UPDATE hotel_notifications
      SET
        sms_provider = $1,
        sms_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        sms_provider AS provider,
        sms_config AS config,
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

export async function updateHotelPushNotifications({ hotelId, provider, config, configPatch }) {
  const existing = await getHotelNotifications(hotelId);

  if (provider !== undefined && !isPushProvider(provider)) {
    throw new Error("invalid_push_provider");
  }

  const replacement = ensurePlainObject(config);
  if (config !== undefined && !replacement) {
    throw new Error("invalid_push_config");
  }

  const nextConfig = replacement ?? mergeConfig(existing.push.config, configPatch);
  const nextProvider = provider ?? existing.push.provider;

  const rows = await query(
    `
      UPDATE hotel_notifications
      SET
        push_provider = $1,
        push_config = $2::jsonb,
        updated_at = NOW()
      WHERE hotel_id = $3
      RETURNING
        hotel_id AS "hotelId",
        push_provider AS provider,
        push_config AS config,
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


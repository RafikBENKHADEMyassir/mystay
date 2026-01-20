import { query } from "../db/postgres.mjs";
import { sendEmail, sendPush, sendSms } from "../notifications/sender.mjs";

const pollMs = Number(process.env.NOTIFICATION_WORKER_POLL_MS ?? 1500);
const batchSize = Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE ?? 10);
const maxAttempts = Number(process.env.NOTIFICATION_WORKER_MAX_ATTEMPTS ?? 8);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffSeconds(attemptNumber) {
  const jitter = Math.floor(Math.random() * 3);
  const base = Math.min(60 * 10, Math.pow(2, Math.max(0, attemptNumber - 1)) * 5);
  return base + jitter;
}

async function claimBatch() {
  return await query(
    `
      UPDATE notification_outbox o
      SET status = 'processing', updated_at = NOW()
      WHERE o.id IN (
        SELECT id
        FROM notification_outbox
        WHERE
          (
            status = 'pending' AND next_attempt_at <= NOW()
          ) OR (
            status = 'processing' AND updated_at <= NOW() - INTERVAL '5 minutes'
          )
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        hotel_id AS "hotelId",
        channel,
        provider,
        to_address AS "toAddress",
        subject,
        body_text AS "bodyText",
        payload AS payload,
        attempts
    `,
    [batchSize]
  );
}

async function getHotelNotificationSettings(hotelId) {
  const rows = await query(
    `
      SELECT
        email_provider AS "emailProvider",
        email_config AS "emailConfig",
        sms_provider AS "smsProvider",
        sms_config AS "smsConfig",
        push_provider AS "pushProvider",
        push_config AS "pushConfig"
      FROM hotel_notifications
      WHERE hotel_id = $1
      LIMIT 1
    `,
    [hotelId]
  );

  return rows[0] ?? null;
}

async function markSent({ id, provider, attempts }) {
  await query(
    `
      UPDATE notification_outbox
      SET status = 'sent', provider = $2, attempts = $3, last_error = NULL, updated_at = NOW()
      WHERE id = $1
    `,
    [id, provider, attempts]
  );
}

async function markRetry({ id, provider, attempts, errorMessage, delaySeconds }) {
  await query(
    `
      UPDATE notification_outbox
      SET
        status = 'pending',
        provider = $2,
        attempts = $3,
        last_error = $4,
        next_attempt_at = NOW() + ($5::text || ' seconds')::interval,
        updated_at = NOW()
      WHERE id = $1
    `,
    [id, provider, attempts, errorMessage, String(delaySeconds)]
  );
}

async function markFailed({ id, provider, attempts, errorMessage }) {
  await query(
    `
      UPDATE notification_outbox
      SET status = 'failed', provider = $2, attempts = $3, last_error = $4, updated_at = NOW()
      WHERE id = $1
    `,
    [id, provider, attempts, errorMessage]
  );
}

async function processItem(item) {
  const settings = await getHotelNotificationSettings(item.hotelId);
  if (!settings) throw new Error("missing_hotel_notifications");

  const attemptNumber = Number(item.attempts ?? 0) + 1;
  if (attemptNumber > maxAttempts) {
    await markFailed({
      id: item.id,
      provider: item.provider,
      attempts: attemptNumber,
      errorMessage: "max_attempts_exceeded"
    });
    return;
  }

  const channel = item.channel;
  const subject = item.subject ?? "MyStay";
  const bodyText = item.bodyText ?? "";
  const data = item.payload ?? {};

  if (channel === "email") {
    const provider = settings.emailProvider;
    const config = settings.emailConfig ?? {};
    await sendEmail({ provider, config, toAddress: item.toAddress, subject, bodyText });
    await markSent({ id: item.id, provider, attempts: attemptNumber });
    return;
  }

  if (channel === "sms") {
    const provider = settings.smsProvider;
    const config = settings.smsConfig ?? {};
    await sendSms({ provider, config, toAddress: item.toAddress, bodyText });
    await markSent({ id: item.id, provider, attempts: attemptNumber });
    return;
  }

  if (channel === "push") {
    const provider = settings.pushProvider;
    const config = settings.pushConfig ?? {};
    await sendPush({
      provider,
      config,
      toAddress: item.toAddress,
      title: subject,
      bodyText,
      data
    });
    await markSent({ id: item.id, provider, attempts: attemptNumber });
    return;
  }

  throw new Error(`unsupported_channel:${channel}`);
}

let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});

console.log("[notifications-worker] started", { pollMs, batchSize, maxAttempts });

while (!stopping) {
  try {
    const items = await claimBatch();
    if (!items.length) {
      await sleep(pollMs);
      continue;
    }

    for (const item of items) {
      try {
        await processItem(item);
      } catch (error) {
        const message = error instanceof Error ? error.message : "send_failed";
        const attempts = Number(item.attempts ?? 0) + 1;
        if (attempts >= maxAttempts) {
          await markFailed({ id: item.id, provider: item.provider, attempts, errorMessage: message });
        } else {
          const delaySeconds = computeBackoffSeconds(attempts);
          await markRetry({ id: item.id, provider: item.provider, attempts, errorMessage: message, delaySeconds });
        }
      }
    }
  } catch (error) {
    console.error("[notifications-worker] loop_error", error);
    await sleep(Math.min(pollMs * 2, 5000));
  }
}

console.log("[notifications-worker] stopped");


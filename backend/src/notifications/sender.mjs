import { createSign } from "node:crypto";

function resolveSecret(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return process.env[trimmed] ?? trimmed;
}

function requireString(value, name) {
  const resolved = resolveSecret(value);
  if (!resolved) throw new Error(`missing_${name}`);
  return resolved;
}

async function sendEmailMock({ toAddress, subject, bodyText }) {
  console.log("[notifications][email][mock]", { toAddress, subject, bodyText });
  return { externalId: `mock-email-${Date.now()}` };
}

async function sendSmsMock({ toAddress, bodyText }) {
  console.log("[notifications][sms][mock]", { toAddress, bodyText });
  return { externalId: `mock-sms-${Date.now()}` };
}

async function sendPushMock({ toAddress, title, bodyText, data }) {
  console.log("[notifications][push][mock]", { toAddress, title, bodyText, data });
  return { externalId: `mock-push-${Date.now()}` };
}

async function sendEmailSendgrid({ config, toAddress, subject, bodyText }) {
  const apiKey = requireString(config.apiKey, "sendgrid_api_key");
  const fromEmail = requireString(config.fromEmail, "sendgrid_from_email");
  const fromName = typeof config.fromName === "string" ? config.fromName.trim() : "";

  const payload = {
    personalizations: [{ to: [{ email: toAddress }] }],
    from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
    subject,
    content: [{ type: "text/plain", value: bodyText }]
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const messageId = response.headers.get("x-message-id") ?? null;
    return { externalId: messageId };
  }
  const details = await response.text().catch(() => "");
  throw new Error(`sendgrid_error_${response.status}:${details.slice(0, 200)}`);
}

async function sendSmsTwilio({ config, toAddress, bodyText }) {
  const accountSid = requireString(config.accountSid, "twilio_account_sid");
  const authToken = requireString(config.authToken, "twilio_auth_token");
  const fromNumber = requireString(config.fromNumber, "twilio_from_number");

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({ To: toAddress, From: fromNumber, Body: bodyText });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (response.ok) {
    const twilioPayload = await response.json().catch(() => null);
    return { externalId: twilioPayload?.sid ?? null };
  }
  const details = await response.text().catch(() => "");
  throw new Error(`twilio_error_${response.status}:${details.slice(0, 200)}`);
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwtRs256({ payload, privateKey, header = { alg: "RS256", typ: "JWT" } }) {
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

const googleAccessTokenCache = new Map();

async function getGoogleAccessToken({ clientEmail, privateKey, tokenUri, scope }) {
  const cacheKey = `${clientEmail}::${tokenUri}::${scope}`;
  const now = Math.floor(Date.now() / 1000);
  const cached = googleAccessTokenCache.get(cacheKey);
  if (cached && cached.exp - 60 > now) return cached.accessToken;

  const jwt = signJwtRs256({
    privateKey,
    payload: {
      iss: clientEmail,
      scope,
      aud: tokenUri,
      iat: now,
      exp: now + 3600
    }
  });

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`google_oauth_error_${response.status}:${JSON.stringify(payload).slice(0, 200)}`);
  }

  const accessToken = typeof payload?.access_token === "string" ? payload.access_token : "";
  const expiresIn = typeof payload?.expires_in === "number" ? payload.expires_in : 3600;
  if (!accessToken) throw new Error("google_oauth_missing_access_token");

  googleAccessTokenCache.set(cacheKey, { accessToken, exp: now + expiresIn });
  return accessToken;
}

function parseServiceAccount(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;

  const raw = resolveSecret(value);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function sendPushFirebase({ config, toAddress, title, bodyText, data }) {
  const serviceAccount = parseServiceAccount(config.serviceAccountJson ?? config.serviceAccount);
  if (!serviceAccount) throw new Error("missing_firebase_service_account");

  const clientEmail = requireString(serviceAccount.client_email, "firebase_client_email");
  const privateKey = requireString(serviceAccount.private_key, "firebase_private_key");
  const tokenUri = requireString(serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token", "firebase_token_uri");
  const projectId = requireString(config.projectId ?? serviceAccount.project_id, "firebase_project_id");

  const accessToken = await getGoogleAccessToken({
    clientEmail,
    privateKey,
    tokenUri,
    scope: "https://www.googleapis.com/auth/firebase.messaging"
  });

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: {
        token: toAddress,
        notification: { title, body: bodyText },
        data: Object.fromEntries(
          Object.entries(data ?? {}).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
        )
      }
    })
  });

  if (response.ok) {
    const fcmPayload = await response.json().catch(() => null);
    return { externalId: fcmPayload?.name ?? null };
  }
  const details = await response.text().catch(() => "");
  throw new Error(`firebase_error_${response.status}:${details.slice(0, 200)}`);
}

export async function sendEmail({ provider, config, toAddress, subject, bodyText }) {
  if (provider === "none") throw new Error("email_disabled");
  if (provider === "mock") return await sendEmailMock({ toAddress, subject, bodyText });
  if (provider === "sendgrid") return await sendEmailSendgrid({ config, toAddress, subject, bodyText });

  throw new Error(`email_provider_not_supported:${provider}`);
}

export async function sendSms({ provider, config, toAddress, bodyText }) {
  if (provider === "none") throw new Error("sms_disabled");
  if (provider === "mock") return await sendSmsMock({ toAddress, bodyText });
  if (provider === "twilio") return await sendSmsTwilio({ config, toAddress, bodyText });

  throw new Error(`sms_provider_not_supported:${provider}`);
}

export async function sendPush({ provider, config, toAddress, title, bodyText, data }) {
  if (provider === "none") throw new Error("push_disabled");
  if (provider === "mock") return await sendPushMock({ toAddress, title, bodyText, data });
  if (provider === "firebase") return await sendPushFirebase({ config, toAddress, title, bodyText, data });

  throw new Error(`push_provider_not_supported:${provider}`);
}


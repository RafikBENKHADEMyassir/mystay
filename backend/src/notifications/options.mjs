export const emailProviders = ["none", "mock", "sendgrid", "mailgun", "ses"];
export const smsProviders = ["none", "mock", "twilio", "messagebird"];
export const pushProviders = ["none", "mock", "firebase", "onesignal"];

export const emailProviderConfigTemplates = {
  none: {},
  mock: {},
  sendgrid: { apiKey: "SENDGRID_API_KEY", fromEmail: "noreply@example.com" },
  mailgun: { apiKey: "MAILGUN_API_KEY", domain: "mg.example.com", fromEmail: "noreply@example.com" },
  ses: { accessKeyId: "AWS_ACCESS_KEY_ID", secretAccessKey: "AWS_SECRET_ACCESS_KEY", region: "eu-west-1" }
};

export const smsProviderConfigTemplates = {
  none: {},
  mock: {},
  twilio: { accountSid: "TWILIO_ACCOUNT_SID", authToken: "TWILIO_AUTH_TOKEN", fromNumber: "+10000000000" },
  messagebird: { apiKey: "MESSAGEBIRD_API_KEY", originator: "MyStay" }
};

export const pushProviderConfigTemplates = {
  none: {},
  mock: {},
  firebase: { serviceAccountJson: "{...}", projectId: "FIREBASE_PROJECT_ID" },
  onesignal: { appId: "ONESIGNAL_APP_ID", apiKey: "ONESIGNAL_API_KEY" }
};

export function isEmailProvider(value) {
  return emailProviders.includes(value);
}

export function isSmsProvider(value) {
  return smsProviders.includes(value);
}

export function isPushProvider(value) {
  return pushProviders.includes(value);
}


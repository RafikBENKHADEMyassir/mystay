import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(contents) {
  const lines = contents.split(/\r?\n/);
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push([key, value]);
  }

  return entries;
}

export function loadEnv() {
  const envPath = path.join(backendDir, ".env");
  if (!fs.existsSync(envPath)) return;

  const contents = fs.readFileSync(envPath, "utf8");
  const entries = parseEnv(contents);

  for (const [key, value] of entries) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}


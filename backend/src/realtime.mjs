import { randomUUID } from "node:crypto";

import { createNotificationClient, query } from "./db/postgres.mjs";

const channel = "mystay_events";

let listenerClient = null;
let listenerStarting = null;
let pingTimer = null;

const subscribers = new Map();

function writeSse(res, { event, data }) {
  if (res.destroyed || res.writableEnded) return;
  const payload = data === undefined ? "" : JSON.stringify(data);
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${payload}\n\n`);
  } catch {
    // ignore disconnected clients
  }
}

function startPing() {
  if (pingTimer) return;

  pingTimer = setInterval(() => {
    for (const { res } of subscribers.values()) {
      writeSse(res, { event: "ping", data: { time: new Date().toISOString() } });
    }
  }, 25000);

  pingTimer.unref?.();
}

function stopPingIfIdle() {
  if (subscribers.size !== 0) return;
  if (!pingTimer) return;
  clearInterval(pingTimer);
  pingTimer = null;
}

export async function ensureRealtimeListener() {
  if (listenerClient) return;
  if (listenerStarting) return listenerStarting;

  listenerStarting = (async () => {
    listenerClient = createNotificationClient();
    await listenerClient.connect();
    await listenerClient.query(`LISTEN ${channel}`);

    listenerClient.on("notification", (message) => {
      if (message.channel !== channel) return;
      if (!message.payload) return;

      let event;
      try {
        event = JSON.parse(message.payload);
      } catch {
        return;
      }

      if (!event || typeof event !== "object") return;

      const eventHotelId = typeof event.hotelId === "string" ? event.hotelId : null;
      const eventDepartment = typeof event.department === "string" ? event.department : null;
      const eventTicketId = typeof event.ticketId === "string" ? event.ticketId : null;
      const eventStayId = typeof event.stayId === "string" ? event.stayId : null;

      for (const subscriber of subscribers.values()) {
        if (subscriber.hotelId && eventHotelId !== subscriber.hotelId) continue;
        if (subscriber.stayId && eventStayId !== subscriber.stayId) continue;
        if (subscriber.threadId && subscriber.threadId !== event.threadId) continue;
        if (subscriber.ticketId && subscriber.ticketId !== eventTicketId) continue;
        if (Array.isArray(subscriber.departments) && subscriber.departments.length > 0) {
          if (!eventDepartment || !subscriber.departments.includes(eventDepartment)) continue;
        }
        writeSse(subscriber.res, { event: event.type ?? "message", data: event });
      }
    });
  })().finally(() => {
    listenerStarting = null;
  });

  return listenerStarting;
}

export function subscribeMessages({ res, threadId, ticketId, hotelId, stayId, departments }) {
  const id = randomUUID();
  const normalizedDepartments = Array.isArray(departments)
    ? departments.filter((dept) => typeof dept === "string").map((dept) => dept.trim()).filter(Boolean)
    : null;

  subscribers.set(id, {
    res,
    threadId,
    ticketId,
    hotelId,
    stayId,
    departments: normalizedDepartments && normalizedDepartments.length > 0 ? normalizedDepartments : null
  });
  startPing();

  return () => {
    subscribers.delete(id);
    stopPingIfIdle();
  };
}

export async function emitRealtimeEvent(event) {
  await query(`SELECT pg_notify('${channel}', $1)`, [JSON.stringify(event)]);
}

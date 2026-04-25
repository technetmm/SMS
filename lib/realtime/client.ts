import type { RealtimeSnapshot } from "@/lib/realtime/types";

const REALTIME_STREAM_PATH = "/api/realtime/stream";
const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

type Listener = (snapshot: RealtimeSnapshot) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;
let reconnectTimer: number | null = null;
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

function clearReconnectTimer() {
  if (reconnectTimer == null || typeof window === "undefined") {
    return;
  }
  window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function closeSource() {
  if (!source) return;
  source.close();
  source = null;
}

function emitSnapshot(snapshot: RealtimeSnapshot) {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function parseSnapshotPayload(input: unknown): RealtimeSnapshot | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const value = input as Partial<RealtimeSnapshot>;
  if (
    typeof value.unreadCount !== "number" ||
    !Array.isArray(value.reminderSlots) ||
    !Array.isArray(value.pendingDeviceApprovals) ||
    typeof value.generatedAt !== "string"
  ) {
    return null;
  }

  return value as RealtimeSnapshot;
}

function scheduleReconnect() {
  if (typeof window === "undefined") return;
  if (reconnectTimer != null || listeners.size === 0) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, reconnectDelay);

  reconnectDelay = Math.min(MAX_RECONNECT_DELAY_MS, reconnectDelay * 2);
}

function connect() {
  if (typeof window === "undefined") return;
  if (!("EventSource" in window)) return;
  if (listeners.size === 0) return;
  if (source) return;

  source = new EventSource(REALTIME_STREAM_PATH, {
    withCredentials: true,
  });

  source.addEventListener("snapshot", (event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }

    try {
      const parsed = JSON.parse(event.data) as unknown;
      const snapshot = parseSnapshotPayload(parsed);
      if (!snapshot) return;
      reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
      emitSnapshot(snapshot);
    } catch {
      // Ignore malformed payloads and keep stream alive.
    }
  });

  source.onerror = () => {
    closeSource();
    scheduleReconnect();
  };
}

export function isRealtimeStreamSupported() {
  return typeof window !== "undefined" && "EventSource" in window;
}

export function subscribeRealtimeSnapshots(listener: Listener) {
  listeners.add(listener);
  connect();

  return () => {
    listeners.delete(listener);

    if (listeners.size > 0) {
      return;
    }

    clearReconnectTimer();
    reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    closeSource();
  };
}

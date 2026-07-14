import { ConfigNode, StatusMessage, WSSubscription } from "./types";
import { WebSocket } from "ws";

const RECONNECT_DELAY_MS = 5000;
const PING_INTERVAL_MS = 10 * 1000;
const PING_TIMEOUT_MS = 20 * 1000;

function setStatusForAll(server: ConfigNode, status: StatusMessage) {
  // reflect on the config node itself (visible via admin API / config sidebar)
  try {
    server.status(status);
  } catch {
    // ignore — node may not be fully wired yet
  }
  Object.values(server.subscriptions).forEach((sub: WSSubscription) =>
    sub.onStatus(status)
  );
}

export function scheduleReconnect(
  server: ConfigNode,
  delayMs = RECONNECT_DELAY_MS
) {
  if (server.shouldReconnect === false) return;
  if (server.reconnectTimer) return;
  console.log(`[${server.host}] Scheduling reconnect in ${delayMs}ms`);
  server.reconnectTimer = setTimeout(() => {
    server.reconnectTimer = null;
    connect(server);
  }, delayMs);
}

function teardownSocket(server: ConfigNode) {
  if (server.keepAlive) {
    clearInterval(server.keepAlive);
    server.keepAlive = null;
  }
  if (server.webSocket) {
    try {
      server.webSocket.removeAllListeners();
      server.webSocket.terminate();
    } catch (e) {
      // ignore
    }
    server.webSocket = null;
  }
}

export async function connect(server: ConfigNode) {
  server.shouldReconnect = true;

  if (server.connecting) {
    console.log(`[${server.host}] Connect already in progress, skipping`);
    return;
  }
  server.connecting = true;

  let lastPing = Date.now();

  teardownSocket(server);
  setStatusForAll(server, {
    fill: "blue",
    shape: "dot",
    text: "connecting...",
  });

  if (!server.credentials.session) {
    console.log(`[${server.host}] No session — attempting login`);
    const ok = await server.api.login();
    if (!ok) {
      setStatusForAll(server, {
        fill: "red",
        shape: "dot",
        text: "Please login first.",
      });
      server.connecting = false;
      scheduleReconnect(server);
      return;
    }
  }

  const sources = await server.api.sources();

  if (sources.status === "error") {
    console.error("Error fetching sources", sources.payload);
    setStatusForAll(server, {
      fill: "red",
      shape: "dot",
      text: String(sources.payload.error),
    });
    server.connecting = false;
    scheduleReconnect(server);
    return;
  }

  console.log("Connecting to WebSocket!");

  let ws: WebSocket;
  try {
    ws = new WebSocket(
      `${server.host.replace("http", "ws")}:${server.port}/subscription`
    );
  } catch (e) {
    console.error(`[${server.host}] Failed to construct WebSocket`, e);
    server.connecting = false;
    scheduleReconnect(server);
    return;
  }
  server.webSocket = ws;

  ws.on("open", () => {
    console.log("Connected to WebSocket");
    lastPing = Date.now();
    server.connecting = false;
    setStatusForAll(server, {
      fill: "blue",
      shape: "dot",
      text: "subscribing...",
    });

    if (server.keepAlive) clearInterval(server.keepAlive);
    server.keepAlive = setInterval(() => {
      if (server.webSocket !== ws || ws.readyState !== WebSocket.OPEN) {
        // socket replaced or no longer open; close handler will recover
        return;
      }
      if (Date.now() - lastPing < PING_TIMEOUT_MS) {
        try {
          ws.send(JSON.stringify({ action: "ping" }));
        } catch (e) {
          console.error(`[${server.host}] Failed to send ping`, e);
        }
      } else {
        console.log(
          `[${server.host}] No activity for ${PING_TIMEOUT_MS}ms. Reconnecting...`
        );
        setStatusForAll(server, {
          fill: "red",
          shape: "dot",
          text: "reconnecting",
        });
        // terminate triggers the close handler, which schedules reconnect
        try {
          ws.terminate();
        } catch (e) {
          // ignore
        }
      }
    }, PING_INTERVAL_MS);

    const msg = {
      action: "subscribe",
      session: server.credentials.session,
      sources: sources.payload,
    };

    try {
      console.log(
        `Subscribing to ${sources.payload.length} sources on ${server.host}`
      );
      ws.send(JSON.stringify(msg));
    } catch (error) {
      console.error("Error sending message\n" + JSON.stringify(msg));
      setStatusForAll(server, {
        fill: "red",
        shape: "dot",
        text: "error" + JSON.stringify(error),
      });
    }
  });

  let everSawMessage = false;
  ws.on("message", (event: string) => {
    try {
      lastPing = Date.now();
      if (!everSawMessage) {
        everSawMessage = true;
        try {
          server.status({ fill: "green", shape: "dot", text: "connected" });
        } catch {
          // ignore
        }
      }
      const data = JSON.parse(event);
      Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
        try {
          if (sub.filter(data)) {
            sub.onMessage(data);
            sub.onStatus({
              fill: "green",
              shape: "dot",
              text: "connected",
            });
          }
        } catch (e) {
          console.error("Error in subscription filter", e);
        }
      });
    } catch (error) {
      console.error("Error parsing message\n" + event);
    }
  });

  ws.on("close", (code: number, reason: Buffer) => {
    console.log(
      `[${server.host}] WebSocket closed (${code})${reason?.length ? ": " + reason.toString() : ""}`
    );
    setStatusForAll(server, {
      fill: "red",
      shape: "dot",
      text: "disconnected.",
    });
    if (server.keepAlive) {
      clearInterval(server.keepAlive);
      server.keepAlive = null;
    }
    if (server.webSocket === ws) {
      server.webSocket = null;
    }
    server.connecting = false;
    scheduleReconnect(server);
  });

  ws.on("error", (error: Error) => {
    console.error(`[${server.host}] WebSocket error`, error?.message ?? error);
    setStatusForAll(server, {
      fill: "red",
      shape: "dot",
      text: "error: " + (error?.message ?? "unknown"),
    });
    // 'close' fires after 'error' on the ws library and schedules the reconnect
  });
}

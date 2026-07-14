import { WebSocket } from "ws";
import { ParseConfigNode, StatusMessage } from "./types";

export type LiveQueryEventName =
  | "create"
  | "update"
  | "delete"
  | "enter"
  | "leave";

export interface LiveQuerySubscription {
  className: string;
  where?: Record<string, any>;
  fields?: string[];
  onEvent: (
    event: LiveQueryEventName,
    data: { object?: any; original?: any }
  ) => void;
  onStatus: (status: StatusMessage) => void;
}

const EVENT_OPS: LiveQueryEventName[] = [
  "create",
  "update",
  "delete",
  "enter",
  "leave",
];

/**
 * Opens a websocket to the Parse LiveQuery server, performs the
 * connect/subscribe handshake and reconnects with backoff until the
 * returned unsubscribe function is called.
 */
export function subscribeLiveQuery(
  server: ParseConfigNode,
  subscription: LiveQuerySubscription
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let attempts = 0;
  const requestId = 1;

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    attempts++;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempts));
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (closed) return;
    const url = server.api.getLiveQueryUrl();
    subscription.onStatus({
      fill: "yellow",
      shape: "ring",
      text: "connecting to " + url,
    });

    try {
      ws = new WebSocket(url);
    } catch (error) {
      subscription.onStatus({
        fill: "red",
        shape: "ring",
        text: "invalid LiveQuery URL: " + url,
      });
      scheduleReconnect();
      return;
    }

    ws.on("open", () => {
      const credentials: Partial<ParseConfigNode["credentials"]> =
        server.credentials || {};
      const connectMessage: Record<string, any> = {
        op: "connect",
        applicationId: server.appId,
      };
      if (server.useMasterKey && credentials.masterKey) {
        connectMessage.masterKey = credentials.masterKey;
      }
      if (credentials.javascriptKey) {
        connectMessage.javascriptKey = credentials.javascriptKey;
      }
      if (credentials.sessionToken) {
        connectMessage.sessionToken = credentials.sessionToken;
      }
      ws?.send(JSON.stringify(connectMessage));
    });

    ws.on("message", (raw) => {
      let data: any;
      try {
        data = JSON.parse(raw.toString());
      } catch (error) {
        return;
      }

      if (data.op === "connected") {
        attempts = 0;
        const subscribeMessage: Record<string, any> = {
          op: "subscribe",
          requestId,
          query: {
            className: subscription.className,
            where: subscription.where || {},
          },
        };
        if (subscription.fields && subscription.fields.length > 0) {
          subscribeMessage.query.fields = subscription.fields;
        }
        if (server.credentials?.sessionToken) {
          subscribeMessage.sessionToken = server.credentials.sessionToken;
        }
        ws?.send(JSON.stringify(subscribeMessage));
      } else if (data.op === "subscribed") {
        subscription.onStatus({
          fill: "green",
          shape: "dot",
          text: "subscribed: " + subscription.className,
        });
      } else if (data.op === "error") {
        subscription.onStatus({
          fill: "red",
          shape: "dot",
          text: `error ${data.code ?? ""}: ${data.error ?? "unknown"}`,
        });
        if (data.reconnect === false) {
          // Server refuses this connection permanently (e.g. bad keys).
          closed = true;
          try {
            ws?.close();
          } catch (error) {
            /* ignore */
          }
        }
      } else if (EVENT_OPS.includes(data.op)) {
        subscription.onEvent(data.op as LiveQueryEventName, {
          object: data.object,
          original: data.original,
        });
      }
    });

    ws.on("close", () => {
      if (!closed) {
        subscription.onStatus({
          fill: "red",
          shape: "ring",
          text: "disconnected",
        });
        scheduleReconnect();
      }
    });

    ws.on("error", (error) => {
      subscription.onStatus({
        fill: "red",
        shape: "ring",
        text: "ws error: " + error.message,
      });
    });
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ op: "unsubscribe", requestId }));
      } catch (error) {
        /* ignore */
      }
    }
    try {
      ws?.close();
    } catch (error) {
      /* ignore */
    }
    ws = null;
  };
}

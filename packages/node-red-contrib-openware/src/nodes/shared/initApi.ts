import {
  ConfigNode,
  DataItemMessage,
  ItemMessage,
  LoginStatus,
  SentMessage,
  SourceMessage,
  WSSubscription,
} from "./types";
import { errorType, OWItemType } from "./types";
import { connect, scheduleReconnect } from "./connectWS";
import { checkSession, requestSession } from "./auth";
import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import type { NodeAPI } from "node-red";

type RedWithComms = NodeAPI & {
  comms: {
    publish: (topic: string, data: unknown, retain?: boolean) => void;
  };
};

export async function initApi(node: ConfigNode, RED: NodeAPI) {
  console.log("-".repeat(20), "Setting up open.WARE API", "-".repeat(20));
  console.log("Host:", node.host + ":" + node.port);
  console.log("-".repeat(50));
  node.subscriptions = {};
  node.shouldReconnect = true;

  const redWithComms = RED as RedWithComms;
  const topic = `openware-config/${node.id}/login-status`;

  const setLoginStatus = (
    state: LoginStatus["state"],
    text: string
  ) => {
    const status =
      state === "ok"
        ? ({ fill: "green", shape: "dot", text } as const)
        : state === "logging-in"
        ? ({ fill: "blue", shape: "ring", text } as const)
        : state === "failed"
        ? ({ fill: "red", shape: "dot", text } as const)
        : ({ fill: "grey", shape: "ring", text } as const);
    node.status(status);
    // propagate to any active subscriptions so subscriber nodes show it too
    Object.values(node.subscriptions || {}).forEach((sub) => {
      try {
        sub.onStatus(status);
      } catch {
        // ignore
      }
    });
    // persist + push to editor clients
    const payload: LoginStatus = { state, text, ts: Date.now() };
    node.lastLoginStatus = payload;
    try {
      redWithComms.comms.publish(topic, payload, true);
    } catch (e) {
      // RED.comms not available (older Node-RED?) — ignore
    }
    // emit for any code that wants to listen
    node.emit("openware:login-status", payload);
  };

  let loginPromise: Promise<boolean> | null = null;
  const login = async (): Promise<boolean> => {
    if (loginPromise) return loginPromise;
    loginPromise = (async () => {
      if (!node.credentials.username || !node.credentials.password) {
        const msg =
          "Cannot login: no username/password on config node";
        node.warn(msg);
        setLoginStatus("failed", "No credentials");
        return false;
      }
      setLoginStatus("logging-in", "logging in...");
      try {
        const result = await requestSession(
          `${node.host}:${node.port}`,
          node.credentials.username,
          node.credentials.password
        );
        // explicit comparison: the editor bundle compiles this file without
        // strictNullChecks, where !result.ok would not narrow the union
        if (result.ok === false) {
          node.warn(`Login failed: ${result.reason}`);
          setLoginStatus("failed", result.reason);
          return false;
        }
        node.credentials.session = result.session;
        node.log("Login succeeded — session refreshed");
        setLoginStatus("ok", "logged in");
        return true;
      } catch (e) {
        node.error(`Login error: ${(e as Error)?.message ?? e}`);
        setLoginStatus("failed", "Login error");
        return false;
      } finally {
        loginPromise = null;
      }
    })();
    return loginPromise;
  };

  let sessionCheckPromise: Promise<boolean> | null = null;
  const isSessionValid = async (): Promise<boolean> => {
    if (!node.credentials.session) return false;
    if (sessionCheckPromise) return sessionCheckPromise;
    sessionCheckPromise = (async () => {
      try {
        return await checkSession(
          `${node.host}:${node.port}`,
          node.credentials.session
        );
      } catch (e) {
        node.warn(`Session check failed: ${(e as Error)?.message ?? e}`);
        return false;
      } finally {
        sessionCheckPromise = null;
      }
    })();
    return sessionCheckPromise;
  };

  // open.WARE answers an invalid or expired session with 403, not 401
  const isAuthError = (resp: Response) =>
    resp.status === 401 || resp.status === 403;

  const authFetch = async (
    url: string,
    init?: RequestInit
  ): Promise<Response> => {
    const doFetch = (): Promise<Response> =>
      fetch(url, {
        ...init,
        headers: {
          ...(init?.headers as Record<string, string> | undefined),
          "OD-SESSION": node.credentials.session || "",
        },
      });
    let resp = await doFetch();
    if (!isAuthError(resp)) return resp;
    // only log in again if the session itself is gone; a 403 with a valid
    // session means this request was rejected (e.g. missing permission)
    if (!(await isSessionValid()) && (await login())) {
      resp = await doFetch();
      if (!isAuthError(resp)) return resp;
    }
    const reason = await resp
      .clone()
      .text()
      .catch(() => "");
    node.warn(
      `${init?.method ?? "GET"} ${url} rejected with HTTP ${resp.status}${
        resp.statusText ? ` ${resp.statusText}` : ""
      }${reason ? `: ${reason.slice(0, 500)}` : ""}`
    );
    return resp;
  };

  const items = async (source?: string | undefined): Promise<ItemMessage> => {
    const url = source
      ? `${node.host}:${node.port}/api/data/items/${source}`
      : `${node.host}:${node.port}/api/data/items`;
    let text: string | undefined;
    try {
      const resp = await authFetch(url);
      text = await resp.text();
      const result = JSON.parse(text);
      return {
        status: "success",
        items: result,
        payload: result,
      };
    } catch (e) {
      console.error("Error fetching items", e);
      return {
        status: "error",
        payload: { error: e, response: text, url },
      };
    }
  };

  const sources = async (): Promise<SourceMessage> => {
    const cItems = await items();
    if (cItems.status === "success") {
      try {
        const allSourceTags = cItems.payload.map((item) => item.source);
        const uniqueSourcesArray = Array.from(new Set(allSourceTags));
        return {
          status: "success",
          payload: uniqueSourcesArray,
          sources: uniqueSourcesArray,
        };
      } catch (e) {
        return {
          status: "error",
          payload: { error: e, response: "Failed to process sources" },
        };
      }
    } else {
      return cItems;
    }
  };

  const history = async (
    source: string,
    sensor: string,
    start: number,
    end: number
  ): Promise<DataItemMessage> => {
    const url = `${node.host}:${node.port}/api/data/historical/${source}/${sensor}/${start}/${end}`;
    let text: string | undefined;
    try {
      const resp = await authFetch(url);
      text = await resp.text();
      const result = JSON.parse(text);
      return { status: "success", item: result, payload: result };
    } catch (e) {
      return {
        status: "error",
        payload: { error: e, response: text },
        url,
      };
    }
  };

  const live = async (
    source: string,
    sensor: string,
    end: number,
    amount: number
  ): Promise<DataItemMessage> => {
    const url = `${node.host}:${node.port}/api/data/live/${source}/${sensor}?at=${end}&values=${amount}`;
    let text: string | undefined;
    try {
      const resp = await authFetch(url);
      text = await resp.text();
      const result = JSON.parse(text);
      return { status: "success", item: result, payload: result };
    } catch (e) {
      return {
        status: "error",
        payload: { error: e, response: text },
        url,
      };
    }
  };

  const pipe = async (pipe: any): Promise<DataItemMessage> => {
    const url = `${node.host}:${node.port}/api/transform/pipe`;
    let text: string | undefined;
    try {
      const resp = await authFetch(url, {
        method: "POST",
        body: JSON.stringify(pipe),
      });
      text = await resp.text();
      const result = JSON.parse(text);
      if (result.status === 200) {
        return {
          status: "success",
          item: result.result,
          payload: result.result,
          request: pipe,
        };
      }
      throw new Error(text);
    } catch (e) {
      return {
        status: "error",
        payload: { error: e, response: text },
        url,
      };
    }
  };

  const send = async (
    data: OWItemType | OWItemType[],
    mode: "update" | "push"
  ) => {
    const url = `${node.host}:${node.port}/api/data/${mode}`;
    let text: string | undefined;
    try {
      const resp = await authFetch(url, {
        method: "POST",
        body: JSON.stringify(data),
      });
      text = await resp.text();
      const result = JSON.parse(text);
      if (result.status === 200) {
        return result.result;
      }
      return { payload: result };
    } catch (e) {
      return { error: e, response: text, url };
    }
  };

  const sendStream = (
    data: OWItemType,
    mode: "update" | "push"
  ): SentMessage => {
    if (!node.credentials.session) {
      // try a background login so future calls succeed
      login().catch(() => {});
      return {
        status: "error",
        payload: { error: "not logged in" } as errorType,
      };
    }
    if (node.webSocket && node.webSocket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        action: mode,
        items: [data],
        session: node.credentials.session,
      });
      node.webSocket.send(message);
      return {
        status: "success",
        item: data,
        payload: data,
      };
    }
    // socket isn't open — kick off a reconnect so it'll be available next time
    scheduleReconnect(node);
    return {
      status: "error",
      payload: { error: "WebSocket not connected" } as errorType,
    };
  };

  const addSubscription = (sub: WSSubscription) => {
    const id = "ID_" + randomUUID();
    node.subscriptions[id] = sub;
    console.log("Added subscription", id, sub.description || "");
    console.log("Subscriptions:", Object.keys(node.subscriptions));
    return () => {
      delete node.subscriptions[id];
    };
  };

  const destroy = () => {
    node.shouldReconnect = false;
    if (node.reconnectTimer) {
      clearTimeout(node.reconnectTimer);
      node.reconnectTimer = null;
    }
    if (node.keepAlive) {
      clearInterval(node.keepAlive);
      node.keepAlive = null;
    }
    if (node.webSocket) {
      try {
        node.webSocket.removeAllListeners();
        node.webSocket.close();
      } catch (e) {
        // ignore
      }
    }
    node.webSocket = null;
  };

  node.api = {
    items,
    sources,
    history,
    live,
    pipe,
    send,
    sendStream,
    addSubscription,
    destroy,
    login,
  };

  setLoginStatus("idle", "starting...");
  // Reuse a stored session only if open.WARE still accepts it
  if (await isSessionValid()) {
    setLoginStatus("ok", "session valid");
  } else {
    await login();
  }
  connect(node);
}

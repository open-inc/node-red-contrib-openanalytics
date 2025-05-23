import {
  ConfigNode,
  DataItemMessage,
  ItemMessage,
  SentMessage,
  SourceMessage,
  WSSubscription,
} from "./types";
import { errorType, OWItemType } from "./types";
import { connect } from "./connectWS";
import { WebSocket } from "ws";
export async function initApi(node: ConfigNode) {
  console.log("-".repeat(20), "Setting up open.WARE API", "-".repeat(20));
  console.log("Host:", node.host + ":" + node.port);
  console.log("-".repeat(50));
  let f = fetch;
  node.subscriptions = {};
  const items = async (source?: string | undefined) => {
    let resp;
    let text;
    let url;
    try {
      if (source) {
        url = `${node.host}:${node.port}/api/data/items/${source}`;
        resp = await f(url, {
          headers: {
            "OD-SESSION": node.credentials.session,
          },
        });
        text = await resp.text();
        const result = JSON.parse(text);
      } else {
        url = `${node.host}:${node.port}/api/data/items`;

        resp = await f(url, {
          headers: {
            "OD-SESSION": node.credentials.session,
          },
        });
        text = await resp.text();
      }
      const result = JSON.parse(text);
      return {
        status: "success",
        items: result,
        payload: result,
      } as ItemMessage;
    } catch (e) {
      console.error("Error fetching items", e);
      return {
        status: "error",
        payload: { error: e, response: text },
        url,
      } as ItemMessage;
    }
  };

  const sources = async (): Promise<SourceMessage> => {
    const cItems = await items();
    if (cItems.status === "success") {
      const allSourceTags = cItems.payload.map((item) => item.source);
      const uniqueSources = new Set(allSourceTags);
      const uniqueSourcesArray = Array.from(uniqueSources);
      return {
        status: "success",
        payload: uniqueSourcesArray,
        sources: uniqueSourcesArray,
      };
    } else {
      return cItems;
    }
  };

  const history = async (
    source: string,
    sensor: string,
    start: number,
    end: number
  ) => {
    let resp;
    let text;
    let url;
    try {
      url = `${node.host}:${node.port}/api/data/historical/${source}/${sensor}/${start}/${end}`;
      resp = await f(url, {
        headers: {
          "OD-SESSION": node.credentials.session,
        },
      });
      text = await resp.text();
      const result = JSON.parse(text);
      return {
        status: "success",
        item: result,
        payload: result,
      } as DataItemMessage;
    } catch (e) {
      return { status: "error", payload: e, url } as DataItemMessage;
    }
  };
  const live = async (
    source: string,
    sensor: string,
    end: number,
    amount: number
  ) => {
    let resp;
    let text;
    let url;
    try {
      url = `${node.host}:${node.port}/api/data/live/${source}/${sensor}?at=${end}&values=${amount}`;
      resp = await f(url, {
        headers: {
          "OD-SESSION": node.credentials.session,
        },
      });
      text = await resp.text();
      const result = JSON.parse(text);
      return {
        status: "success",
        item: result,
        payload: result,
      } as DataItemMessage;
    } catch (e) {
      return { status: "error", payload: e, url } as DataItemMessage;
    }
  };
  const pipe = async (pipe: any) => {
    let resp;
    let text;
    let url;
    try {
      url = `${node.host}:${node.port}/api/transform/pipe`;
      resp = await f(url, {
        method: "POST",
        headers: {
          "OD-SESSION": node.credentials.session,
        },
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
        } as DataItemMessage;
      } else {
        throw new Error(text);
      }
    } catch (e) {
      return {
        status: "error",
        payload: { error: e, response: text },
        url,
      } as DataItemMessage;
    }
  };
  const send = async (
    data: OWItemType | OWItemType[],
    mode: "update" | "push"
  ) => {
    let resp;
    let text;
    let url;
    try {
      url = `${node.host}:${node.port}/api/data/${mode}`;
      resp = await f(url, {
        method: "POST",
        headers: {
          "OD-SESSION": node.credentials.session,
        },
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
    if (node.credentials.session) {
      if (node.webSocket && node.webSocket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          action: mode,
          items: [data],
          session: node.credentials.session,
        });
        node.webSocket.send(message);
        return {
          status: "success",
          payload: data,
        } as SentMessage;
      } else {
        return {
          status: "error",
          payload: { error: "WebSocket not connected" } as errorType,
        };
      }
    } else {
      return {
        status: "error",
        payload: { error: "not logged in" } as errorType,
      };
    }
  };
  const addSubscription = (sub: WSSubscription) => {
    const id = "ID_" + Math.random().toString(16);
    node.subscriptions[id] = sub;
    console.log("Subscriptions", node.subscriptions);
    return () => {
      delete node.subscriptions[id];
    };
  };
  const destroy = () => {
    if (node.keepAlive) clearInterval(node.keepAlive);
    if (node.webSocket) node.webSocket.close();
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
  };
  connect(node);
}

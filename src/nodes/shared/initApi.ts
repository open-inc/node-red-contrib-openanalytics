import {
  ConfigNode,
  DataItemMessage,
  ItemMessage,
  SourceMessage,
} from "./types";
import { errorType, OWItemType } from "./types";

export async function initApi(node: ConfigNode) {
  console.log("-".repeat(20), "Setting up open.WARE API", "-".repeat(20));
  console.log("Host:", node.host + ":" + node.port);
  console.log("-".repeat(50));
  let f = fetch;
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
        return result.result;
      }
      return {
        status: "success",
        item: result,
        payload: result,
        request: pipe,
      };
    } catch (e) {
      return { status: "error", payload: { error: e, response: text }, url };
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

  node.api = {
    items,
    sources,
    history,
    live,
    pipe,
    send,
  };
}

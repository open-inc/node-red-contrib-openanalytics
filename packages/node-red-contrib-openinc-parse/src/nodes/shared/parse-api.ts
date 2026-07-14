import {
  ParseApiResult,
  ParseConfigNode,
  ParseFindResult,
  ParseQuery,
} from "./types";

function normalizeUrl(url: string): string {
  let result = (url || "").trim().replace(/\/+$/, "");
  if (result && !/^https?:\/\//i.test(result)) {
    result = "http://" + result;
  }
  return result;
}

export function buildHeaders(node: ParseConfigNode): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Parse-Application-Id": node.appId,
    "Content-Type": "application/json",
  };
  const credentials: Partial<ParseConfigNode["credentials"]> =
    node.credentials || {};
  if (credentials.restApiKey) {
    headers["X-Parse-REST-API-Key"] = credentials.restApiKey;
  }
  if (credentials.javascriptKey) {
    headers["X-Parse-Javascript-Key"] = credentials.javascriptKey;
  }
  if (node.useMasterKey && credentials.masterKey) {
    headers["X-Parse-Master-Key"] = credentials.masterKey;
  }
  if (credentials.sessionToken) {
    headers["X-Parse-Session-Token"] = credentials.sessionToken;
  }
  return headers;
}

export function initParseApi(node: ParseConfigNode): void {
  const request = async (
    method: string,
    path: string,
    body?: any,
    query?: Record<string, string>
  ): Promise<ParseApiResult> => {
    const base = normalizeUrl(node.serverUrl);
    let url: URL;
    try {
      url = new URL(base + path);
    } catch (error) {
      return {
        status: "error",
        payload: { error: `Invalid server URL: ${node.serverUrl}` },
      };
    }
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    try {
      const response = await fetch(url, {
        method,
        headers: buildHeaders(node),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        data = { raw: text };
      }
      if (!response.ok) {
        return {
          status: "error",
          payload: {
            error: data?.error ?? response.statusText,
            code: data?.code ?? response.status,
            url: url.toString(),
          },
        };
      }
      return { status: "success", payload: data };
    } catch (error) {
      return {
        status: "error",
        payload: { error: String(error), url: url.toString() },
      };
    }
  };

  node.api = {
    request,

    create: (className, data) => request("POST", `/classes/${className}`, data),

    update: (className, objectId, data) =>
      request("PUT", `/classes/${className}/${objectId}`, data),

    destroy: (className, objectId) =>
      request("DELETE", `/classes/${className}/${objectId}`),

    find: async (query: ParseQuery) => {
      const params: Record<string, string> = {};
      if (query.where && Object.keys(query.where).length > 0) {
        params.where = JSON.stringify(query.where);
      }
      if (query.limit !== undefined) params.limit = String(query.limit);
      if (query.skip !== undefined) params.skip = String(query.skip);
      if (query.order) params.order = query.order;
      if (query.keys) params.keys = query.keys;
      if (query.include) params.include = query.include;
      if (query.count) params.count = "1";
      const result = await request(
        "GET",
        `/classes/${query.className}`,
        undefined,
        params
      );
      return result as ParseApiResult<ParseFindResult>;
    },

    getLiveQueryUrl: () => {
      if (node.liveQueryUrl && node.liveQueryUrl.trim() !== "") {
        let url = node.liveQueryUrl.trim().replace(/\/+$/, "");
        if (!/^wss?:\/\//i.test(url)) {
          url = "ws://" + url.replace(/^https?:\/\//i, "");
        }
        return url;
      }
      return normalizeUrl(node.serverUrl).replace(/^http/i, "ws");
    },
  };
}

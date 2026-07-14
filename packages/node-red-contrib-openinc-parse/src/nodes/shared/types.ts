import { Node, NodeStatusShape } from "node-red";

export type StatusMessage = {
  fill: "red" | "green" | "yellow" | "blue" | "grey";
  shape: NodeStatusShape;
  text: string;
};

export type ParseErrorResult = {
  error: any;
  code?: number;
  url?: string;
};

export type ParseApiResult<T = any> =
  | { status: "success"; payload: T }
  | { status: "error"; payload: ParseErrorResult };

export type ParseQuery = {
  className?: string;
  where?: Record<string, any>;
  limit?: number;
  skip?: number;
  order?: string;
  keys?: string;
  include?: string;
  count?: boolean;
};

export type ParseFindResult = {
  results: any[];
  count?: number;
};

export type ParseConfigNode = Node & {
  serverUrl: string;
  liveQueryUrl?: string;
  appId: string;
  useMasterKey: boolean;
  schema?: string;
  credentials: {
    restApiKey: string;
    javascriptKey: string;
    masterKey: string;
    sessionToken: string;
  };
  api: {
    create: (
      className: string,
      data: Record<string, any>
    ) => Promise<ParseApiResult>;
    update: (
      className: string,
      objectId: string,
      data: Record<string, any>
    ) => Promise<ParseApiResult>;
    destroy: (className: string, objectId: string) => Promise<ParseApiResult>;
    find: (query: ParseQuery) => Promise<ParseApiResult<ParseFindResult>>;
    request: (
      method: string,
      path: string,
      body?: any,
      query?: Record<string, string>
    ) => Promise<ParseApiResult>;
    getLiveQueryUrl: () => string;
  };
};

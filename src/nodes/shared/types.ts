import { NodeMessage, NodeMessageInFlow } from "node-red";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { Node, NodeDef } from "node-red";
export type ProcessChild = ChildProcessWithoutNullStreams | undefined | null;
export type ValueType = {
  type: "number" | "string" | "boolean" | "geo" | "object" | "String" | "Boolean" | "Number" | "Geo" | "Object";
  name: string;
  unit: string;
};
export type DataPoint = {
  date: number;
  value: any[];
};

export type errorType = {
  error: any;
  response?: string;
  url?: string;
};
export type ApiMessage = SourceMessage | ItemMessage | DataItemMessage;
export type SourceMessage =
  | { status: "success"; sources: string[]; payload: string[] }
  | { status: "error"; payload: errorType };
export type ItemMessage =
  | { status: "success"; items: OWItemType[]; payload: OWItemType[] }
  | { status: "error"; payload: errorType };
export type DataItemMessage =
  | {
      status: "success";
      item: OWItemType;
      payload: OWItemType;
      request?: any;
    }
  | { status: "error"; payload: errorType; url?: string };

export type OWItemType = {
  name: string;
  source: string;
  id: string;
  type: string;
  values: {
    date: number;
    value: any[];
  }[];
  valueTypes: ValueType[];
};

export type ConfigNode = Node & {
  host: string;
  port: number;
  api: {
    items: (source?: string) => Promise<ItemMessage>;
    sources: () => Promise<SourceMessage>;
    history: (
      source: string,
      sensor: string,
      start: number,
      end: number
    ) => Promise<DataItemMessage>;
    live: (
      source: string,
      sensor: string,
      end: number,
      amount: number
    ) => Promise<DataItemMessage>;
    pipe: (pipe: any) => Promise<DataItemMessage>;
    send: (
      data: OWItemType,
      mode: "update" | "push"
    ) => Promise<{ payload: any } | errorType>;
  };
  credentials: {
    username: string;
    password: string;
    session: string;
  };
};

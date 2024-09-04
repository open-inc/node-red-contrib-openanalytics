import { NodeMessageInFlow } from "node-red";

type operation =
  | "sum"
  | "mean"
  | "min"
  | "max"
  | "count"
  | "diffminmax"
  | "difffirstlast"
  | "first"
  | "last";
type interval =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";
export interface OpenwareDataAggregateOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  interval: interval;
  operation: operation;
  delimiter?: string;
}

export type PipePayloadType = {
  pipe: any;
};
export type HistoricPayloadType = {
  source: string;
  sensor: string;
  start: number;
  end: number;
  operation: operation;
  interval: interval;
  dimension: number;
};
export type AggregateMsgPayloadType = NodeMessageInFlow &
  (PipePayloadType | HistoricPayloadType);

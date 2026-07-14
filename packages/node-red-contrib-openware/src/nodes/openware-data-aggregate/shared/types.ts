import { HistoricalMsgPayloadType } from "../../openware-data-historical/shared/types";
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
  pipe?: any[];
};

export type AggregateMsgPayloadType = PipePayloadType &
  HistoricalMsgPayloadType;

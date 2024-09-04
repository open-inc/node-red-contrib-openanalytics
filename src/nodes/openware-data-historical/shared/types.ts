import { NodeMessageInFlow } from "node-red";

export interface OpenwareDataHistoricalOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";

  delimiter?: string;
}

export type HistoricalMsgPayloadType = NodeMessageInFlow & {
  source: string;
  sensor: string;
  start: number;
  end: number;
};

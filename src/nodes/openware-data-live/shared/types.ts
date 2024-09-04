import { NodeMessageInFlow } from "node-red";

export interface OpenwareDataLiveOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  amount?: number;
  delimiter?: string;
}
export type LiveMsgType = NodeMessageInFlow & {
  date?: number;
  amount?: number;
};
export type LiveMsgPayloadType = NodeMessageInFlow & {
  source: string;
  sensor: string;
};

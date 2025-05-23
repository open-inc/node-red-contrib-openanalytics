import { NodeMessageInFlow } from "node-red";

export interface OpenwareDataLiveOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  amount?: number;
  delimiter?: string;
}

export type LiveMsgPayloadType = NodeMessageInFlow & {
  amount?: number;
  date?: number;

  query?: {
    end?: number;
    sensorInfos?: {
      source: string;
      sensor: string;
    }[];
  };
};

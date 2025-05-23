import { NodeMessageInFlow } from "node-red";

export interface OpenwareDataHistoricalOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";

  delimiter?: string;
}

export type HistoricalMsgPayloadType = NodeMessageInFlow & {
  amount?: number;
  date?: number;

  query?: {
    sensorInfos: {
      source: string;
      sensor: string;
      dimension?: number;
    }[];
    start: number;
    end: number;
  };
};

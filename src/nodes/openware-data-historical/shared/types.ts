import { NodeMessageInFlow } from "node-red";
import { SensorInfoType } from "src/nodes/shared/types";

export interface OpenwareDataHistoricalOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";

  delimiter?: string;
}

export type HistoricalMsgPayloadType = NodeMessageInFlow & {
  amount?: number;
  date?: number;

  query?: {
    sensorInfos: SensorInfoType[];
    start: number;
    end: number;
  };
};

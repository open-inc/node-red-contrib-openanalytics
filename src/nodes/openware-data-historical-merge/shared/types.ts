export interface OpenwareDataHistoricalMergeOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  delimiter?: string;
}

export type PipePayloadType = {
  pipe: any;
};
export type HistoricMergePayloadType = {
  sensorInfos: {
    source: string;
    sensor: string;
    dimension: number;
  }[];
  start: number;
  end: number;
};

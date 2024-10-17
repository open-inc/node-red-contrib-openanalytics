export interface OpenwareDataHistoricalMergeOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  delimiter?: string;
}

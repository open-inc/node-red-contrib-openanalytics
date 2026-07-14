export interface OpenwareDataPcaOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  delimiter?: string;
}

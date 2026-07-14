export interface OpenincParseConfigOptions {
  serverUrl: string;
  liveQueryUrl?: string;
  appId: string;
  useMasterKey: boolean;
  // JSON string of the Parse schema (as exported from the dashboard / fetched
  // via /schemas). Read by other node editors to drive class/field autocomplete.
  schema?: string;
}

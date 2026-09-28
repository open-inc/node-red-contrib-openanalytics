export interface OpenwareConfigOptions {
  // node options

  username?: string;
  password?: string;
  session?: string;
}

// ok: null means the check did not apply (e.g. node not deployed yet)
export type ConnectionCheck = { ok: boolean | null; text: string };

export type ConnectionTestResult = {
  credentials: ConnectionCheck;
  session: ConnectionCheck;
};

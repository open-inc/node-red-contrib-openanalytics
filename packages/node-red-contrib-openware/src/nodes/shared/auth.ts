// Plain open.WARE auth requests, shared by the runtime API and the config
// node's connection test. Network errors are thrown to the caller.

export type LoginResult =
  | { ok: true; session: string }
  | { ok: false; reason: string };

export async function requestSession(
  baseUrl: string,
  username: string,
  password: string,
  signal?: AbortSignal
): Promise<LoginResult> {
  const query = new URLSearchParams({ username, password });
  const resp = await fetch(`${baseUrl}/api/users/login?${query.toString()}`, {
    signal,
  });
  if (!resp.ok) {
    return {
      ok: false,
      reason: `HTTP ${resp.status}${resp.statusText ? ` ${resp.statusText}` : ""}`,
    };
  }
  const json = (await resp.json()) as {
    status?: number;
    result?: { session?: string };
  };
  if (!json?.result?.session) {
    return {
      ok: false,
      reason:
        json?.status && json.status !== 200
          ? `open.WARE status ${json.status}`
          : "Bad login response",
    };
  }
  return { ok: true, session: json.result.session };
}

export async function checkSession(
  baseUrl: string,
  session: string,
  signal?: AbortSignal
): Promise<boolean> {
  const resp = await fetch(`${baseUrl}/api/users/me`, {
    headers: { "OD-SESSION": session },
    signal,
  });
  if (!resp.ok) return false;
  const json = (await resp.json()) as { status?: number };
  return json?.status === 200;
}

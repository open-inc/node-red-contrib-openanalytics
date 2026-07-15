import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { Node, NodeAPI } from "node-red";
import { WebSocket, WebSocketServer } from "ws";

const LIST_PATH = "/openware/virtual-sensors";
const WS_PATH_SUFFIX = "/openware/virtual-sensors/ws";
const MAX_CACHED_VALUES = 50;
const WS_PING_INTERVAL_MS = 15 * 1000;

export interface ValueDimensionConfig {
  name: string;
  unit: string;
  type: string;
}

export interface VirtualSensorConfigData {
  sensorId: string;
  sensorName: string;
  source: string;
  valueTypes: ValueDimensionConfig[];
  meta: Record<string, unknown>;
  timeout: number;
}

// One timestamped reading; `value` holds one entry per configured dimension.
export interface OWValueEntry {
  date: number;
  value: unknown[];
}

// JSON shape consumed by open.WARE's OpenWareDataItem.fromJSON()
export interface VirtualSensorItem {
  id: string;
  source: string;
  name: string;
  meta: Record<string, unknown>;
  valueTypes: ValueDimensionConfig[];
  values: OWValueEntry[];
}

interface RegistryEntry {
  node: Node;
  config: VirtualSensorConfigData;
  wired: boolean;
  lastValues: OWValueEntry[]; // newest first
}

const registry = new Map<string, RegistryEntry>(); // keyed by Node-RED node id

export function buildItemJSON(
  config: VirtualSensorConfigData,
  values: OWValueEntry[] = [],
): VirtualSensorItem {
  return {
    id: config.sensorId,
    source: config.source,
    name: config.sensorName,
    meta: { ...config.meta },
    valueTypes: config.valueTypes.map((vt) => ({ ...vt })),
    values,
  };
}

function findBySensorId(sensorId: string): RegistryEntry | undefined {
  let found: RegistryEntry | undefined;
  registry.forEach((entry) => {
    if (!found && entry.config.sensorId === sensorId) {
      found = entry;
    }
  });
  return found;
}

export function registerVirtualSensor(
  node: Node,
  config: VirtualSensorConfigData,
  wired: boolean,
): { duplicate: boolean } {
  const duplicate = !!findBySensorId(config.sensorId);
  registry.set(node.id, { node, config, wired, lastValues: [] });
  broadcastSensorsChanged();
  return { duplicate };
}

export function unregisterVirtualSensor(nodeId: string): void {
  if (registry.delete(nodeId)) {
    broadcastSensorsChanged();
  }
}

export interface NormalizedPayload {
  values: OWValueEntry[];
  overrides: {
    name?: string;
    meta?: Record<string, unknown>;
    valueTypes?: ValueDimensionConfig[];
  };
}

function isPrimitive(v: unknown): boolean {
  return (
    typeof v === "number" || typeof v === "string" || typeof v === "boolean"
  );
}

function toEntry(raw: unknown): OWValueEntry {
  if (isPrimitive(raw)) {
    return { date: Date.now(), value: [raw] };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as { date?: unknown; value?: unknown };
    if (typeof obj.date === "number" && obj.value !== undefined) {
      return {
        date: obj.date,
        value: Array.isArray(obj.value) ? obj.value : [obj.value],
      };
    }
  }
  throw new Error(
    "Unsupported value entry - expected primitive or {date, value}",
  );
}

/**
 * Accepted payload shapes (used by the sensor node's input port and the
 * response node alike):
 * - primitive               -> one reading, stamped with Date.now()
 * - array of primitives     -> one reading with one entry per dimension
 * - {date, value}           -> one reading
 * - array of {date, value}  -> multiple readings
 * - {values: <any of the above>, name?, meta?, valueTypes?} -> readings plus
 *   overrides of the statically configured sensor fields
 */
export function normalizePayload(payload: unknown): NormalizedPayload {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.values) || obj.values === undefined) {
      if (obj.values !== undefined || obj.date === undefined) {
        const overrides: NormalizedPayload["overrides"] = {};
        if (typeof obj.name === "string") overrides.name = obj.name;
        if (obj.meta && typeof obj.meta === "object") {
          overrides.meta = obj.meta as Record<string, unknown>;
        }
        if (Array.isArray(obj.valueTypes)) {
          overrides.valueTypes = obj.valueTypes as ValueDimensionConfig[];
        }
        const values =
          obj.values === undefined ? [] : (obj.values as unknown[]);
        return {
          values: normalizeValueList(values),
          overrides,
        };
      }
    }
  }
  return { values: normalizeValueList(payload), overrides: {} };
}

function normalizeValueList(payload: unknown): OWValueEntry[] {
  if (payload === undefined || payload === null) return [];
  if (isPrimitive(payload)) return [toEntry(payload)];
  if (Array.isArray(payload)) {
    if (payload.length === 0) return [];
    if (payload.every(isPrimitive)) {
      // one reading with one entry per dimension
      return [{ date: Date.now(), value: payload }];
    }
    return payload.map(toEntry);
  }
  return [toEntry(payload)];
}

function assertDimensions(
  entries: OWValueEntry[],
  valueTypes: ValueDimensionConfig[],
): void {
  for (const entry of entries) {
    if (entry.value.length !== valueTypes.length) {
      throw new Error(
        `Value has ${entry.value.length} dimension(s) but the sensor defines ${valueTypes.length}`,
      );
    }
  }
}

/**
 * Updates the cached live value of a sensor node and pushes the update to
 * all connected WebSocket clients. Returns the normalized entries.
 */
export function updateLiveValue(
  nodeId: string,
  payload: unknown,
): OWValueEntry[] {
  const entry = registry.get(nodeId);
  if (!entry) throw new Error("Virtual sensor is not registered");

  const { values } = normalizePayload(payload);
  if (values.length === 0) {
    throw new Error("Payload did not contain any values");
  }
  assertDimensions(values, entry.config.valueTypes);

  const sorted = [...values].sort((a, b) => b.date - a.date); // newest first
  entry.lastValues = [...sorted, ...entry.lastValues].slice(
    0,
    MAX_CACHED_VALUES,
  );

  broadcastLive(buildItemJSON(entry.config, sorted));
  return sorted;
}

/* ------------------------- pending historic requests ------------------- */

interface PendingRequest {
  resolve: (payload: unknown) => void;
  timer: NodeJS.Timeout;
}

const pending = new Map<string, PendingRequest>();

function createPending(timeoutMs: number): {
  handleId: string;
  promise: Promise<unknown>;
} {
  const handleId = randomUUID();
  const promise = new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(handleId);
      reject(new Error("Timed out waiting for a virtual sensor response"));
    }, timeoutMs);
    pending.set(handleId, { resolve, timer });
  });
  return { handleId, promise };
}

export function resolvePending(handleId: string, payload: unknown): boolean {
  const req = pending.get(handleId);
  if (!req) return false;
  pending.delete(handleId);
  clearTimeout(req.timer);
  req.resolve(payload);
  return true;
}

/* ------------------------------- auth ---------------------------------- */

function getToken(RED: NodeAPI): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = RED.settings as any;
  return (
    settings.openwareVirtualSensors?.token ||
    process.env.OPENWARE_VIRTUAL_SENSORS_TOKEN ||
    undefined
  );
}

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function isAuthorized(RED: NodeAPI, authHeader: string | undefined): boolean {
  const token = getToken(RED);
  if (!token) return true; // no token configured -> open (warned at startup)
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return safeEqual(authHeader.substring("Bearer ".length).trim(), token);
}

/* --------------------------- WebSocket push ----------------------------- */

let wss: WebSocketServer | null = null;

function broadcast(message: Record<string, unknown>): void {
  if (!wss) return;
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastLive(item: VirtualSensorItem): void {
  broadcast({ type: "live", item });
}

function broadcastSensorsChanged(): void {
  broadcast({ type: "sensors-changed" });
}

function initWsServer(RED: NodeAPI): void {
  const root = String(RED.settings.httpNodeRoot || "/");
  const wsPath =
    (root.endsWith("/") ? root.slice(0, -1) : root) + WS_PATH_SUFFIX;

  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket & { isAlive?: boolean }) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const pingInterval = setInterval(() => {
    wss?.clients.forEach((client) => {
      const ws = client as WebSocket & { isAlive?: boolean };
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, WS_PING_INTERVAL_MS);
  pingInterval.unref();

  RED.server.on(
    "upgrade",
    (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const url = (req.url || "").split("?")[0];
      if (url !== wsPath) return; // not ours - leave it to other handlers
      if (!isAuthorized(RED, req.headers.authorization)) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss?.handleUpgrade(req, socket, head, (ws) => {
        wss?.emit("connection", ws, req);
      });
    },
  );
}

/* ------------------------------ HTTP API -------------------------------- */

let apiRegistered = false;

export function registerVirtualSensorApi(RED: NodeAPI): void {
  if (apiRegistered) return;
  apiRegistered = true;

  if (RED.settings.httpNodeRoot === false || !RED.httpNode) {
    RED.log.error(
      "[openware-virtual-sensor] Cannot register the virtual sensor API: httpNodeRoot is disabled",
    );
    return;
  }

  if (!getToken(RED)) {
    RED.log.warn(
      "[openware-virtual-sensor] No bearer token configured - the virtual sensor API is unprotected. " +
        "Set openwareVirtualSensors.token in settings.js or the OPENWARE_VIRTUAL_SENSORS_TOKEN environment variable.",
    );
  }

  initWsServer(RED);

  RED.httpNode.get(LIST_PATH, (req, res) => {
    if (!isAuthorized(RED, req.headers.authorization)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const items: VirtualSensorItem[] = [];
    const seen = new Set<string>();
    registry.forEach((entry) => {
      if (seen.has(entry.config.sensorId)) {
        entry.node.warn(
          `Duplicate virtual sensor id "${entry.config.sensorId}" - sensor is not listed`,
        );
        return;
      }
      seen.add(entry.config.sensorId);
      items.push(buildItemJSON(entry.config, entry.lastValues.slice(0, 1)));
    });
    res.json(items);
  });

  RED.httpNode.get(`${LIST_PATH}/:id/data`, (req, res) => {
    if (!isAuthorized(RED, req.headers.authorization)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const entry = findBySensorId(String(req.params.id));
    if (!entry) {
      res
        .status(404)
        .json({ error: `Unknown virtual sensor "${req.params.id}"` });
      return;
    }

    const mode = String(req.query.mode || "live");
    if (mode === "live") {
      handleLiveRequest(entry, req.query, res);
    } else if (mode === "historic") {
      handleHistoricRequest(entry, req.query, res);
    } else {
      res.status(400).json({ error: `Unknown mode "${mode}"` });
    }
  });
}

interface QueryParams {
  [key: string]: unknown;
}

interface JsonResponse {
  status: (code: number) => JsonResponse;
  json: (body: unknown) => void;
}

function handleLiveRequest(
  entry: RegistryEntry,
  query: QueryParams,
  res: JsonResponse,
): void {
  let values = entry.lastValues;
  const at = Number(query.at);
  if (Number.isFinite(at) && at > 0) {
    values = values.filter((v) => v.date <= at);
  }
  const amount = Number(query.amount);
  if (Number.isFinite(amount) && amount > 0) {
    values = values.slice(0, amount);
  }
  res.json(buildItemJSON(entry.config, values));
}

function handleHistoricRequest(
  entry: RegistryEntry,
  query: QueryParams,
  res: JsonResponse,
): void {
  if (!entry.wired) {
    // no flow attached to compute historic values
    res.json(buildItemJSON(entry.config, []));
    return;
  }

  const start = Number(query.start) || 0;
  const end = Number(query.end) || Date.now();
  const { handleId, promise } = createPending(entry.config.timeout);

  entry.node.send({
    _owvs: handleId,
    topic: entry.config.sensorId,
    sensor: buildItemJSON(entry.config, []),
    payload: { mode: "historic", start, end },
  });

  promise.then(
    (payload) => {
      try {
        const { values, overrides } = normalizePayload(payload);
        assertDimensions(
          values,
          overrides.valueTypes ?? entry.config.valueTypes,
        );
        const item = buildItemJSON(entry.config, values);
        if (overrides.name) item.name = overrides.name;
        if (overrides.meta) item.meta = { ...item.meta, ...overrides.meta };
        if (overrides.valueTypes) item.valueTypes = overrides.valueTypes;
        res.json(item);
      } catch (err) {
        res.status(502).json({
          error: `Invalid response payload from flow: ${String(
            err instanceof Error ? err.message : err,
          )}`,
        });
      }
    },
    () => {
      entry.node.warn(
        `Historic request for "${entry.config.sensorId}" timed out after ${entry.config.timeout}ms`,
      );
      res.status(504).json({
        error: `Virtual sensor "${entry.config.sensorId}" did not respond within ${entry.config.timeout}ms`,
      });
    },
  );
}

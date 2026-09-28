import { NodeInitializer } from "node-red";
import { OpenwareConfigNode, OpenwareConfigNodeDef } from "./modules/types";
import { initApi } from "../shared/initApi";
import { checkSession, requestSession } from "../shared/auth";
import { LoginStatus } from "../shared/types";
import { ConnectionCheck, ConnectionTestResult } from "./shared/types";

const TEST_TIMEOUT_MS = 10 * 1000;

type ConnectionTestRequest = {
  id?: string;
  host?: string;
  port?: string | number;
  username?: string;
  password?: string;
};

// undici only says "fetch failed"; the cause holds e.g. ECONNREFUSED
function errorText(e: unknown): string {
  const err = e as {
    message?: string;
    cause?: { code?: string; message?: string };
  };
  return err?.cause?.code ?? err?.cause?.message ?? err?.message ?? String(e);
}

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareConfigNodeConstructor(
    this: OpenwareConfigNode,
    config: OpenwareConfigNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    initApi(this, RED);
    this.on("close", () => {
      console.log("Closing API....");
      this.api.destroy();
    });
  }

  RED.nodes.registerType("openware-config", OpenwareConfigNodeConstructor, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" },
      session: { type: "text" },
    },
  });

  // Snapshot endpoint so a freshly opened config dialog gets current state
  // before any new comms messages arrive.
  RED.httpAdmin.get(
    "/openware/config/:id/login-status",
    RED.auth.needsPermission("flows.read"),
    (req, res) => {
      const node = RED.nodes.getNode(String(req.params.id)) as OpenwareConfigNode | null;
      if (!node) {
        res.status(404).send({ error: "Config node not found" });
        return;
      }
      const fallback: LoginStatus = {
        state: "idle",
        text: "unknown",
        ts: 0,
      };
      res.send(node.lastLoginStatus ?? fallback);
    }
  );

  const testCredentials = async (
    body: ConnectionTestRequest,
    running: OpenwareConfigNode | null
  ): Promise<ConnectionCheck> => {
    const host = String(body.host ?? "").trim();
    const port = String(body.port ?? "").trim();
    const username = String(body.username ?? "");
    let password = String(body.password ?? "");
    if (!host || !port) {
      return { ok: false, text: "Host and port are required" };
    }
    if (!username) return { ok: false, text: "Username is required" };
    if (password === "__PWRD__") {
      // The dialog only has a placeholder for a saved password. Use the saved
      // one only against the host it belongs to, so it is never sent elsewhere.
      if (
        !running ||
        String(running.host).trim() !== host ||
        String(running.port) !== port
      ) {
        return {
          ok: false,
          text: "Enter the password again to test a new or changed host",
        };
      }
      password = running.credentials.password ?? "";
    }
    if (!password) return { ok: false, text: "Password is required" };

    const baseUrl = `${host}:${port}`;
    try {
      const result = await requestSession(
        baseUrl,
        username,
        password,
        AbortSignal.timeout(TEST_TIMEOUT_MS)
      );
      return result.ok
        ? { ok: true, text: `Login as "${username}" works` }
        : { ok: false, text: `Login failed: ${result.reason}` };
    } catch (e) {
      return { ok: false, text: `Request to ${baseUrl} failed: ${errorText(e)}` };
    }
  };

  const testSession = async (
    running: OpenwareConfigNode | null
  ): Promise<ConnectionCheck> => {
    if (!running) return { ok: null, text: "Not deployed yet" };
    const baseUrl = `${running.host}:${running.port}`;
    if (!running.credentials?.session) {
      return { ok: false, text: `No session for ${baseUrl}` };
    }
    try {
      const valid = await checkSession(
        baseUrl,
        running.credentials.session,
        AbortSignal.timeout(TEST_TIMEOUT_MS)
      );
      return valid
        ? { ok: true, text: `Session valid on ${baseUrl}` }
        : { ok: false, text: `Session on ${baseUrl} is invalid or expired` };
    } catch (e) {
      return { ok: false, text: `Request to ${baseUrl} failed: ${errorText(e)}` };
    }
  };

  // Tests the credentials entered in the config dialog and the session of the
  // deployed node. Runs in the runtime, since that is where the real requests
  // to open.WARE come from.
  RED.httpAdmin.post(
    "/openware/config/test",
    RED.auth.needsPermission("flows.write"),
    async (req, res) => {
      const body = (req.body ?? {}) as ConnectionTestRequest;
      const running = body.id
        ? (RED.nodes.getNode(body.id) as OpenwareConfigNode | null)
        : null;
      const [credentials, session] = await Promise.all([
        testCredentials(body, running),
        testSession(running),
      ]);
      const result: ConnectionTestResult = { credentials, session };
      res.send(result);
    }
  );
};

export = nodeInit;

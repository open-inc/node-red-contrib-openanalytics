import { NodeInitializer } from "node-red";
import {
  OpenincParseConfigNode,
  OpenincParseConfigNodeDef,
} from "./modules/types";
import { initParseApi } from "../shared/parse-api";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseConfigNodeConstructor(
    this: OpenincParseConfigNode,
    config: OpenincParseConfigNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    this.serverUrl = config.serverUrl;
    this.liveQueryUrl = config.liveQueryUrl;
    this.appId = config.appId;
    this.useMasterKey = config.useMasterKey;
    this.schema = config.schema;
    initParseApi(this);
  }

  RED.nodes.registerType(
    "openinc-parse-config",
    OpenincParseConfigNodeConstructor,
    {
      credentials: {
        restApiKey: { type: "password" },
        javascriptKey: { type: "password" },
        masterKey: { type: "password" },
        sessionToken: { type: "password" },
      },
    }
  );

  // Lets the editor test a connection through the runtime (avoids CORS
  // restrictions of a direct browser request against the Parse server).
  RED.httpAdmin.get(
    "/openinc-parse/test-connection",
    RED.auth.needsPermission("flows.read"),
    async (req, res) => {
      const serverUrl = String(req.query.serverUrl || "").replace(/\/+$/, "");
      const appId = String(req.query.appId || "");
      if (!serverUrl) {
        res.status(400).send({ ok: false, error: "Missing serverUrl" });
        return;
      }
      const url =
        (/^https?:\/\//i.test(serverUrl) ? serverUrl : "http://" + serverUrl) +
        "/health";
      try {
        const response = await fetch(url, {
          headers: appId ? { "X-Parse-Application-Id": appId } : {},
        });
        const text = await response.text();
        res.send({ ok: response.ok, status: response.status, body: text });
      } catch (error) {
        res.send({ ok: false, error: String(error) });
      }
    }
  );

  // Fetches the full schema from the Parse server using the Master Key, for the
  // editor's "Fetch from server" button / master-key auto-fetch. The master key
  // comes either from a freshly-typed value (x-parse-master-key header) or, for
  // an already-saved config node, from its stored credentials (via ?id=).
  RED.httpAdmin.get(
    "/openinc-parse/schema",
    RED.auth.needsPermission("flows.read"),
    async (req, res) => {
      const serverUrl = String(req.query.serverUrl || "").replace(/\/+$/, "");
      const appId = String(req.query.appId || "");
      const id = req.query.id ? String(req.query.id) : "";
      let masterKey = String(req.get("x-parse-master-key") || "");
      if (!masterKey && id) {
        const creds = RED.nodes.getCredentials(id) as
          | { masterKey?: string }
          | undefined;
        masterKey = creds?.masterKey || "";
      }
      if (!serverUrl) {
        res.status(400).send({ ok: false, error: "Missing serverUrl" });
        return;
      }
      if (!masterKey) {
        res
          .status(400)
          .send({ ok: false, error: "Master Key required to fetch schema" });
        return;
      }
      const base =
        (/^https?:\/\//i.test(serverUrl) ? serverUrl : "http://" + serverUrl) +
        "/schemas";
      try {
        const response = await fetch(base, {
          headers: {
            "X-Parse-Application-Id": appId,
            "X-Parse-Master-Key": masterKey,
          },
        });
        const text = await response.text();
        let body: any;
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }
        if (!response.ok) {
          res.send({
            ok: false,
            status: response.status,
            error: body?.error ?? response.statusText,
          });
          return;
        }
        // /schemas returns { results: [ {className, fields, ...}, ... ] }.
        const schema = Array.isArray(body?.results) ? body.results : body;
        res.send({ ok: true, schema });
      } catch (error) {
        res.send({ ok: false, error: String(error) });
      }
    }
  );
};

export = nodeInit;

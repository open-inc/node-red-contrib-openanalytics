import { EditorRED } from "node-red";
import { OpenincParseConfigEditorNodeProperties } from "./modules/types";
import { schemaSummary } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseConfigEditorNodeProperties>(
  "openinc-parse-config",
  {
    category: "config",
    defaults: {
      serverUrl: { value: "http://localhost:1337/parse", required: true },
      liveQueryUrl: { value: "", required: false },
      appId: { value: "", required: true },
      useMasterKey: { value: false, required: false },
      schema: { value: "" },
    },
    //@ts-expect-error credentials are not part of the editor typings
    credentials: {
      restApiKey: { type: "password" },
      javascriptKey: { type: "password" },
      masterKey: { type: "password" },
      sessionToken: { type: "password" },
    },
    label: function () {
      return this.appId
        ? `${this.appId} @ ${this.serverUrl}`
        : this.serverUrl || "parse server";
    },
    oneditprepare: function () {
      const testButton = document.getElementById("openinc-parse-config-test");
      const resultSpan = document.getElementById(
        "openinc-parse-config-test-result"
      );

      testButton?.addEventListener("click", async () => {
        if (!resultSpan) return;
        const serverUrl = String($("#node-config-input-serverUrl").val() || "");
        const appId = String($("#node-config-input-appId").val() || "");
        resultSpan.textContent = "testing...";
        resultSpan.style.color = "#888";
        try {
          // Use $.ajax (not raw fetch) so Node-RED's ajaxSetup attaches the
          // admin auth token. A bare fetch is rejected by the admin API with a
          // plain-text "401 Unauthorized" body when adminAuth is enabled, which
          // then blows up JSON parsing.
          const data = await $.ajax({
            url:
              "openinc-parse/test-connection?serverUrl=" +
              encodeURIComponent(serverUrl) +
              "&appId=" +
              encodeURIComponent(appId),
            dataType: "json",
          });
          if (data.ok) {
            resultSpan.textContent = "OK - server is healthy";
            resultSpan.style.color = "#5cb85c";
          } else {
            resultSpan.textContent =
              "Failed: " + (data.error || `HTTP ${data.status}`);
            resultSpan.style.color = "#d9534f";
          }
        } catch (error) {
          const jqXHR = error as JQueryXHR;
          const detail =
            jqXHR && typeof jqXHR.status === "number"
              ? `HTTP ${jqXHR.status} ${jqXHR.statusText || ""}`.trim()
              : String(error);
          resultSpan.textContent = "Failed: " + detail;
          resultSpan.style.color = "#d9534f";
        }
      });

      // --- Schema: paste, fetch from server, live summary -------------------
      const nodeId = this.id;
      const schemaResult = document.getElementById(
        "openinc-parse-config-schema-result"
      );
      const fetchButton = document.getElementById(
        "openinc-parse-config-fetch-schema"
      );

      const updateSummary = () => {
        if (!schemaResult) return;
        const raw = String($("#node-config-input-schema").val() || "");
        if (raw.trim() === "") {
          schemaResult.textContent = "";
          return;
        }
        const summary = schemaSummary(raw);
        if (summary) {
          schemaResult.textContent = summary;
          schemaResult.style.color = "#888";
        } else {
          schemaResult.textContent = "Invalid schema JSON";
          schemaResult.style.color = "#d9534f";
        }
      };

      const fetchSchema = async (auto: boolean) => {
        const serverUrl = String($("#node-config-input-serverUrl").val() || "");
        const appId = String($("#node-config-input-appId").val() || "");
        const masterKey = String($("#node-config-input-masterKey").val() || "");
        if (!serverUrl) {
          if (schemaResult && !auto) {
            schemaResult.textContent = "Set a Server URL first";
            schemaResult.style.color = "#d9534f";
          }
          return;
        }
        let query =
          "openinc-parse/schema?serverUrl=" +
          encodeURIComponent(serverUrl) +
          "&appId=" +
          encodeURIComponent(appId);
        const headers: Record<string, string> = {};
        // A freshly-typed master key is available here; a previously-saved one
        // is masked as "__PWRD__", so fall back to the stored credential via id.
        if (masterKey && masterKey !== "__PWRD__") {
          headers["x-parse-master-key"] = masterKey;
        } else if (nodeId) {
          query += "&id=" + encodeURIComponent(nodeId);
        }
        if (schemaResult) {
          schemaResult.textContent = "fetching schema...";
          schemaResult.style.color = "#888";
        }
        try {
          const data = await $.ajax({ url: query, headers, dataType: "json" });
          if (data.ok) {
            $("#node-config-input-schema").val(
              JSON.stringify(data.schema, null, 2)
            );
            updateSummary();
          } else if (schemaResult) {
            schemaResult.textContent =
              "Failed: " + (data.error || `HTTP ${data.status}`);
            schemaResult.style.color = "#d9534f";
          }
        } catch (error) {
          if (schemaResult) {
            const jqXHR = error as JQueryXHR;
            schemaResult.textContent =
              "Failed: " +
              (jqXHR && typeof jqXHR.status === "number"
                ? `HTTP ${jqXHR.status} ${jqXHR.statusText || ""}`.trim()
                : String(error));
            schemaResult.style.color = "#d9534f";
          }
        }
      };

      fetchButton?.addEventListener("click", () => fetchSchema(false));
      $("#node-config-input-schema").on("change keyup paste", updateSummary);
      updateSummary();

      // Auto-fetch on open when a master key is present and no schema is set yet.
      const hasMasterKey =
        String($("#node-config-input-masterKey").val() || "") !== "";
      const hasSchema =
        String($("#node-config-input-schema").val() || "").trim() !== "";
      if (hasMasterKey && !hasSchema) {
        fetchSchema(true);
      }
    },
  }
);

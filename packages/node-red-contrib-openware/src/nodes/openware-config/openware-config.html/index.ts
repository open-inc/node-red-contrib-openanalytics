import { EditorRED } from "node-red";
import { OpenwareConfigEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

type LoginStatus = {
  state: "idle" | "logging-in" | "ok" | "failed";
  text: string;
  ts: number;
};

const STATE_COLOR: Record<LoginStatus["state"], string> = {
  ok: "#5cb85c",
  "logging-in": "#5bc0de",
  failed: "#d9534f",
  idle: "#bbb",
};

function renderStatus(s: LoginStatus | null | undefined) {
  const state = (s?.state ?? "idle") as LoginStatus["state"];
  const text = s?.text ?? "unknown";
  $("#openware-config-login-dot").css("background", STATE_COLOR[state] ?? "#bbb");
  $("#openware-config-login-text").text(text);
}

RED.nodes.registerType<OpenwareConfigEditorNodeProperties>("openware-config", {
  category: "config",
  defaults: {
    host: { value: "localhost", required: true },
    port: { value: 4567, required: true, validate: RED.validators.number() },
    username: { value: "", required: true },
    password: { value: "", required: true },
    session: { value: "", required: false },
  },
  label: function () {
    return this.host + ":" + this.port;
  },
  //@ts-expect-error
  credentials: {
    session: { type: "text" },
    username: { type: "text" },
    password: { type: "password" },
  },
  oneditprepare: function () {
    const node = this;
    const topic = `openware-config/${node.id}/login-status`;

    renderStatus({ state: "idle", text: "loading...", ts: 0 });

    // Fetch current snapshot (in case no comms message arrives soon)
    if (node.id) {
      $.getJSON(`openware/config/${node.id}/login-status`)
        .done((data: LoginStatus) => renderStatus(data))
        .fail(() =>
          renderStatus({ state: "idle", text: "(deploy to start)", ts: 0 })
        );
    } else {
      renderStatus({ state: "idle", text: "(deploy to start)", ts: 0 });
    }

    // Subscribe to live updates pushed via RED.comms.publish
    const handler = (_topic: string, payload: LoginStatus) => {
      renderStatus(payload);
    };
    (RED.comms as any).subscribe(topic, handler);
    (node as any)._openwareStatusHandler = { topic, handler };
  },
  oneditcancel: function () {
    const h = (this as any)._openwareStatusHandler;
    if (h) (RED.comms as any).unsubscribe(h.topic, h.handler);
  },
  oneditdelete: function () {
    const h = (this as any)._openwareStatusHandler;
    if (h) (RED.comms as any).unsubscribe(h.topic, h.handler);
  },
  oneditsave: async function () {
    const h = (this as any)._openwareStatusHandler;
    if (h) (RED.comms as any).unsubscribe(h.topic, h.handler);

    console.log("Saving config", this);
    const node = this;
    const host = $("#node-config-input-host").val();
    const port = $("#node-config-input-port").val();
    const username = $("#node-config-input-username").val() as string;
    let password = $("#node-config-input-password").val() as (string | undefined);
    if (password === "__PWRD__") {
      password = undefined;
    }

    if (host && port && username && password) {
      const url = `${host}:${port}/api/users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      console.log("Refreshing session", url);
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === 200) {
        //@ts-expect-error
        this.credentials = {
          session: data.result.session,
          username: username as string,
          password: password as string,
        };
        $("#node-config-input-session").val(data.result.session);
        //@ts-expect-error
        console.log("Session refreshed", this.credentials);
      } else {
        console.log("Error", data);
      }
    } else {
      //@ts-expect-error
      if (node.credentials?.session) {
        const url = `${host}:${port}/api/users/me`;
        const resp = await fetch(url, {
          //@ts-expect-error
          headers: { "OD-SESSION": node.credentials.session },
        });
        const data = await resp.json();
        if (data.status === 200) {
          console.log("Session is still valid");
        } else {
          console.log("Session is invalid");
          $("#node-config-input-session").val("");
        }
      }
    }
  },
});

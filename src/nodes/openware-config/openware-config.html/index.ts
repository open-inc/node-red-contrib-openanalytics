import { EditorRED } from "node-red";
import { OpenwareConfigEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

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
    console.log("Preparing config");
  },
  oneditsave: async function () {
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
      // .then((res) => {
      //     res.json().then((json) => {
      //     if (json.status === 200) {
      //         this.credentials.session = json.result.session;
      //         init(this);
      //         console.log("-".repeat(20), "this New", "-".repeat(20));
      //         console.log(this);
      //         console.log("-".repeat(20), "config new", "-".repeat(20));
      //         console.log(n);
      //     }
      //     });
      // })
      // .catch((err) => {
      //     console.log(err);
      // });
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

import { ConfigNode, WSSubscription } from "./types";
import { WebSocket } from "ws";
async function timeout() {
  return new Promise((res) => setTimeout(res, 5000));
}
export async function connect(server: ConfigNode) {
  let lastPing = Date.now();

  if (server.webSocket) {
    console.log("Closing existing WebSocket connection");
    server.webSocket.close();
    server.webSocket = null;
  }
  Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
    sub.onStatus({ fill: "blue", shape: "dot", text: "connecting..." });
  });
  if (!server.credentials.session) {
    console.error("No session found");
    Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
      sub.onStatus({ fill: "red", shape: "dot", text: "Please login first." });
    });
    return;
  }
  const sources = await server.api.sources();

  if (sources.status === "error") {
    console.error("Error fetching sources", sources.payload);
    Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
      sub.onStatus({ fill: "red", shape: "dot", text: sources.payload.error });
    });

    await timeout();
    connect(server);
    return;
  }
  console.log("Connecting to WebSocket!");

  server.webSocket = new WebSocket(
    `${server.host.replace("http", "ws")}:${server.port}/subscription`
  );

  server.webSocket.on("open", () => {
    console.log("Connected to WebSocket");
    Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
      sub.onStatus({ fill: "blue", shape: "dot", text: "subscribing..." });
    });
    if (server.keepAlive) {
      clearInterval(server.keepAlive);
    }
    server.keepAlive = setInterval(() => {
      // console.log(
      //   `[${server.host}:${server.webSocket?.OPEN === 1 ? "ONLINE" : "OFFLINE"}] Last Ping: ${new Date(lastPing).toUTCString()} `
      // );
      if (Date.now() - lastPing < 20 * 1000) {
        // console.log(`[${server.host}] Sending ping.`);
        if (!server.webSocket || !server.webSocket?.OPEN) {
          server!.webSocket!.send(
            JSON.stringify({
              action: "ping",
            })
          );
        }
      } else {
        console.log(`[${server.host}] Offline. Attempting to reconnect...`);
        Object.values(server.subscriptions).forEach((sub) => {
          sub.onStatus({ fill: "red", shape: "dot", text: "reconnecting" });
        });
        if (server.webSocket) server.webSocket.terminate();
        if (server.keepAlive) {
          clearInterval(server.keepAlive);
        }
        connect(server);
      }
    }, 10 * 1000);

    const msg = {
      action: "subscribe",
      session: server.credentials.session,
      sources: sources.payload,
    };

    try {
      console.log(
        `Subscribing to ${sources.payload.length} sources on ${server.host}`
      );

      server.webSocket!.send(JSON.stringify(msg));
    } catch (error) {
      console.error("Error sending message\n" + JSON.stringify(msg));
      Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
        sub.onStatus({
          fill: "red",
          shape: "dot",
          text: "error" + JSON.stringify(error),
        });
      });
    }
  });
  server.webSocket.on("message", (event: string) => {
    try {
      lastPing = Date.now();

      const data = JSON.parse(event);
      Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
        try {
          if (sub.filter(data)) {
            sub.onMessage(data);
            sub.onStatus({
              fill: "green",
              shape: "dot",
              text: "connected",
            });
          }
        } catch (e) {
          console.error("Error in subscription filter", e);
        }
      });
    } catch (error) {
      console.error("Error parsing message\n" + event);
    }
  });
  server.webSocket.on("close", (event: CloseEvent) => {
    console.log("Disconnected from WebSocket", event);
    Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
      sub.onStatus({ fill: "red", shape: "dot", text: "disconnected." });
    });
    server.webSocket = null;
  });

  server.webSocket.on("error", (event: Event) => {
    Object.values(server.subscriptions).forEach((sub: WSSubscription) => {
      sub.onStatus({
        fill: "red",
        shape: "dot",
        text: "error" + JSON.stringify(event),
      });
    });
  });
}

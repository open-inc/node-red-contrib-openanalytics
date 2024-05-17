import { NodeInitializer, NodeMessageInFlow } from "node-red";
import { LudwigPredictNode, LudwigPredictNodeDef } from "./modules/types";
import { ModelProperties, LudwigPredictMsgType } from "./shared/types";
import { readdirSync } from "node:fs";
import { run, getNextPort } from "../shared/helper";
//@ts-expect-error
import formDataBody from "form-data-body";
import fs from "node:fs";
import path from "path";
import { ProcessChild } from "../shared/types";

const getDirectories = (source: string): ModelProperties[] =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => ({
      name: dirent.name,
      createdAt: fs.statSync(path.join(source, dirent.name)).birthtime,
    }));

const nodeInit: NodeInitializer = (RED): void => {
  function LudwigPredictNodeConstructor(
    this: LudwigPredictNode,
    config: LudwigPredictNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    let child = null as ProcessChild;
    let port: number;
    node.on("input", function (msg, send, done) {
      if ((msg as LudwigPredictMsgType).stop) {
        if (child) {
          child.kill();
        }
        child = null;
        return;
      }
      if (!msg.payload) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No data in msg.payload",
        });
        return;
      }
      const predict = async (data: any) => {
        let text;
        let resp;

        try {
          const boundary = formDataBody.generateBoundary();
          const header = {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          };
          const body = formDataBody(data, boundary);
          console.log("Sending data to server:", JSON.stringify(body));
          // const submission = new Promise((resolve, reject) => {
          //   formData.submit(`http://localhost:${port}/predict`, (err, res) => {
          //     if (err) reject(err);
          //     resolve(res);
          //   });
          // });
          resp = await fetch(`http://0.0.0.0:${port}/predict`, {
            method: "POST",
            body,
            headers: header,
          });
          text = await resp.text();
          return JSON.parse(text.trim());
        } catch (e) {
          return {
            payload: "Server not running",
            error: JSON.stringify(e),
            response: JSON.stringify(resp),
            requestData: JSON.stringify(data),
          };
        }
      };

      if (!child) {
        port = getNextPort();
        const args = [
          "serve",
          "--model_path",
          `./results/${config.modelversion}/model/`,
          "--port",
          "" + port,
        ];

        node.status({
          fill: "blue",
          shape: "dot",
          text: "Model serving started...",
        });
        child = run(
          "ludwig",
          args,
          function (update) {
            if (update.topic === "update") {
              send([null, update]);
              console.log(JSON.stringify(update));
              if (update.payload.toString().includes("0.0.0.0:" + port)) {
                node.status({
                  fill: "green",
                  shape: "dot",
                  text: update.payload
                    .replace("Uvicorn", "Server")
                    .slice(7, 47),
                });
                predict(msg.payload).then((prediction) => {
                  send([{ payload: prediction }, null]);
                });
              }
            }
            if (update.topic === "error") {
              if (update.payload.toString().includes("0.0.0.0:" + port)) {
                node.status({
                  fill: "green",
                  shape: "dot",
                  text: update.payload
                    .replace("Uvicorn", "Server")
                    .slice(7, 47),
                });
                predict(msg.payload).then((prediction) => {
                  send([{ payload: prediction }, null]);
                });
              }
              send([null, update]);
            }
            if (update.topic === "done") {
              node.status({
                fill: "red",
                shape: "dot",
                text: "Server exited",
              });
              child = null;
              send([null, update]);
            }
          },
          path.join(process.cwd(), "models", config.modelname)
        );
      } else {
        predict(msg.payload).then((prediction) => {
          send([{ payload: prediction }, null]);
        });
      }
      done();
    });
  }
  RED.nodes.registerType("ludwig-predict", LudwigPredictNodeConstructor);
  RED.httpAdmin.get("/openware/ludwig/models", function (req, res) {
    console.log("Getting models");
    const models = getDirectories(path.join(process.cwd(), "models"));
    res.send(models);
  });
  RED.httpAdmin.get("/openware/ludwig/models/:name", function (req, res) {
    console.log("Getting runs for model: ", req.params.name);
    const models = getDirectories(
      path.join(process.cwd(), "models", req.params.name, "results")
    );
    res.send(models);
  });
};

export = nodeInit;

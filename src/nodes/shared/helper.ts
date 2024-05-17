import { on } from "events";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as YAML from "json-to-pretty-yaml";
import * as path from "path";
import * as fs from "fs";
import { DataPoint, ProcessChild, ValueType } from "./types";

let lastPort = 30000;
export const getNextPort = (): number => {
  lastPort++;
  return lastPort as number;
};
export const run = (
  command: string,
  args: string[],
  onupdate: (msg: { payload: any; topic: "update" | "error" | "done" }) => void,
  cwd: string
): ProcessChild => {
  console.log(`Spawning:${command}`);
  console.log(`Args:${args}`);
  try {
    const child = spawn(command, args ? args : [], { cwd });

    child.stdout.on("data", (chunk) => {
      if (onupdate) {
        onupdate({ payload: chunk.toString(), topic: "update" });
      }
    });
    child.stderr.on("data", (error) => {
      if (onupdate) {
        onupdate({ payload: error.toString(), topic: "error" });
      }
    });
    child.on("close", (code) => {
      if (onupdate) {
        onupdate({ payload: code, topic: "done" });
      }
    });
    child.on("error", (error) => {
      onupdate({ payload: error, topic: "error" });
    });
    return child;
  } catch (error) {
    console.error(error);
  }
};

const vTypeToConf = (v: ValueType, customconfig: any) => {
  const vtName = v.name.replace(/\s/g, "_");
  //console.log(`Converting ${v.name}[${v.type}] to ${vtName} - feature`);
  if (v.type.toLowerCase() === "string") {
    return {
      name: vtName,
      type: "category",

      ...customconfig,
    };
  }
  if (v.type.toLowerCase() === "number") {
    return {
      name: vtName,
      type: "number",
      //   preprocessing: {
      //     normalization: "zscore",
      //   },

      ...customconfig,
    };
  }
  if (v.type.toLowerCase() === "boolean") {
    return {
      name: vtName,
      type: "binary",

      ...customconfig,
    };
  }
  return null;
};
const slidingWindow = (data: DataPoint[], index: number, size: number) => {
  const result = [];
  const valuesOnly = data.map((d) => d.value[index]);
  for (let i = 0; i < valuesOnly.length - size; i++) {
    result.push(valuesOnly.slice(i, i + size));
  }
  return result;
};

export const forecast = (
  dataObject: { values: DataPoint[]; valueTypes: ValueType[] },
  name: string,
  customconfig: any,
  index: number,
  windowSize: number,
  predcitionSize: number,
  onupdate: (msg: { payload: any; topic: "update" | "error" | "done" }) => void
) => {
  console.log(`Starting to train ${name} with window size of ${windowSize}`);
  const directory = path.join(process.cwd(), "models", name);
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }
  const content = slidingWindow(
    dataObject.values,
    index,
    windowSize + predcitionSize
  ).map(
    (row) =>
      `${row.slice(0, windowSize).join(" ")},${row.slice(windowSize).join(",")}`
  );
  console.log(`Data transformed to ${content.length} rows.`);
  const inputs = [{ name: "input", type: "timeseries" }];
  const headers = ["input"];
  for (let idx = 0; idx < predcitionSize; idx++) {
    headers[idx + 1] = `forecast+${idx + 1}`;
  }
  const outputs = headers
    .filter((_, idx) => idx > 0)
    .map((name) => ({ name, type: "number" }));
  content.unshift(headers.join(","));
  const dataSetLocation = path.join(directory, "data.csv");
  const configLocation = path.join(directory, "config.yaml");
  const config = {
    input_features: inputs,
    output_features: outputs,
  };

  try {
    fs.writeFileSync(dataSetLocation, content.join("\n"));
    fs.writeFileSync(configLocation, YAML.stringify(config));
    // file written successfully
  } catch (err) {
    console.error(err);
  }

  //   console.log("Start Training...")
  const args = [
    "-m",
    "ludwig.train",
    "--config",
    "config.yaml",
    "--dataset",
    "data.csv",
  ];
  //const args = ["./hello.py"];
  //   console.log("Args:", args.join(","))
  console.log(
    "Starting training in location:",
    process.cwd() + "/models/" + name
  );
  const child = run("python", args, onupdate, directory);

  return child;
};

export const autoencode = (
  dataObject: { values: DataPoint[]; valueTypes: ValueType[] },
  name: string,
  customconfig: any,
  index: number,
  windowSize: number,
  onupdate: (msg: { payload: any; topic: "update" | "error" | "done" }) => void
) => {
  console.log(`Starting to train ${name} with window size ${windowSize}`);
  const directory = path.join(process.cwd(), "models", name);
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }
  const content = slidingWindow(dataObject.values, index, windowSize).map(
    (row) => `${row.join(",")},${row.join(",")}`
  );
  console.log(`Data transformed to ${content.length} rows.`);
  const inputs = [];
  const headers = [];
  const outputs = [];
  for (let idx = 0; idx < windowSize; idx++) {
    inputs.push(
      vTypeToConf(dataObject.valueTypes[index], {
        name: `i${idx}`,
        ...customconfig,
      })
    );
    outputs.push(
      vTypeToConf(dataObject.valueTypes[index], {
        name: `o${idx}`,
        ...customconfig,
      })
    );
    headers[idx] = `i${idx}`;
    headers[idx + windowSize] = `o${idx}`;
  }

  content.unshift(headers.join(","));
  const dataSetLocation = path.join(directory, "data.csv");
  const configLocation = path.join(directory, "config.yaml");
  const config = {
    input_features: inputs,
    output_features: outputs,
  };

  try {
    fs.writeFileSync(dataSetLocation, content.join("\n"));
    fs.writeFileSync(configLocation, YAML.stringify(config));
    // file written successfully
  } catch (err) {
    console.error(err);
  }

  //   console.log("Start Training...")
  const args = [
    "-m",
    "ludwig.train",
    "--config",
    "config.yaml",
    "--dataset",
    "data.csv",
  ];
  //const args = ["./hello.py"];
  //   console.log("Args:", args.join(","))
  console.log(
    "Starting training in location:",
    process.cwd() + "/models/" + name
  );
  const child = run("python", args, onupdate, directory);

  return child;
};

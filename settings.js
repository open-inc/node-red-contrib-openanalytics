const parseAuthEnabled = ["1", "true", "yes"].includes(
  String(process.env.OI_PARSE_AUTH_ENABLED).toLowerCase()
);
const parseAuthConfigured =
  !!process.env.OI_PARSE_URL && !!process.env.OI_PARSE_APPID;

if (parseAuthEnabled && !parseAuthConfigured) {
  console.warn(
    "OI_PARSE_AUTH_ENABLED is set but OI_PARSE_URL and/or OI_PARSE_APPID are missing - falling back to default credentials auth"
  );
}

const useParseAuth = parseAuthEnabled && parseAuthConfigured;

// Per-package toggles for the open.INC nodes shipped in the image. Every
// package is ON unless its variable is "0", "false", "no" or "off".
// Disabled packages go on the palette denyList, so Node-RED does not load them
// at all (hidden from the palette, not installable via the palette manager).
//
// Returns true/false for a recognised value, undefined if the variable is
// unset or empty, and throws on anything else to catch typos early.
function envFlag(name) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return undefined;
  const value = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  throw new Error(
    `${name}="${raw}" is not a valid value - use 1/true/yes/on or 0/false/no/off`
  );
}

const nodePackages = {
  parse: "@openinc/node-red-contrib-openinc-parse",
  openware: "@openinc/node-red-contrib-openware",
  openservice: "@openinc/node-red-contrib-openservice",
};

const openserviceFlag = envFlag("OI_NODES_OPENSERVICE");
const activeNodePackages = {
  parse: envFlag("OI_NODES_PARSE") !== false,
  openware: envFlag("OI_NODES_OPENWARE") !== false,
  openservice: openserviceFlag !== false,
};

// The openservice nodes depend on the parse nodes: disabling parse disables
// openservice too, unless openservice was explicitly enabled - that
// contradiction stops Node-RED instead of loading nodes that cannot work.
if (!activeNodePackages.parse && activeNodePackages.openservice) {
  if (openserviceFlag === true) {
    throw new Error(
      "OI_NODES_OPENSERVICE is enabled but OI_NODES_PARSE is disabled - the openservice nodes require the parse nodes. Enable OI_NODES_PARSE or unset OI_NODES_OPENSERVICE."
    );
  }
  console.log(
    "OI_NODES_PARSE is disabled - disabling the openservice nodes, which require it"
  );
  activeNodePackages.openservice = false;
}

const deniedModules = Object.keys(nodePackages)
  .filter((key) => !activeNodePackages[key])
  .map((key) => nodePackages[key]);

if (deniedModules.length > 0) {
  console.log("Disabled node packages:", deniedModules.join(", "));
}

if (useParseAuth) {
  console.log(
    "Using Parse Server authentication against",
    process.env.OI_PARSE_URL
  );
}

module.exports = {
  flowFile: "flows.json",
  // Key used to encrypt flow credentials (flows_cred.json). If unset, Node-RED
  // generates one and stores it in .config.runtime.json in the user dir.
  // Must not change once credentials have been stored.
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || undefined,
  // Shared bearer token protecting the virtual sensor API provided by
  // @openinc/node-red-contrib-openware (HTTP endpoints + WebSocket push).
  // Leave unset to run the API without authentication (not recommended).
  openwareVirtualSensors: {
    token: process.env.OPENWARE_VIRTUAL_SENSORS_TOKEN || undefined,
  },
  externalModules: {
    palette: {
      denyList: deniedModules,
    },
  },
  adminAuth: useParseAuth
    ? require("./user-authentication")
    : {
        type: "credentials",
        users: [
          {
            username: "admin",
            password:
              "$2a$08$LUmqIgjzC7olXicmGKeg4uygEGgQsr3PmOwd/5AV7akDGiG/bFSTK",
            permissions: "*",
          },
        ],
      },
};

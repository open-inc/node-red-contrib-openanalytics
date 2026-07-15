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

if (useParseAuth) {
  console.log(
    "Using Parse Server authentication against",
    process.env.OI_PARSE_URL
  );
}

module.exports = {
  flowFile: "flows.json",
  // Shared bearer token protecting the virtual sensor API provided by
  // @openinc/node-red-contrib-openware (HTTP endpoints + WebSocket push).
  // Leave unset to run the API without authentication (not recommended).
  openwareVirtualSensors: {
    token: process.env.OPENWARE_VIRTUAL_SENSORS_TOKEN || undefined,
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

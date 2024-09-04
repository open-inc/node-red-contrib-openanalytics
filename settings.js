module.exports = {
  flowFile: "flows.json",
  adminAuth: {
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

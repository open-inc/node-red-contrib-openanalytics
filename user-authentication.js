const parseUrl = process.env.OI_PARSE_URL;
const parseAppId = process.env.OI_PARSE_APPID;

function checkUserPermissions(resolve, user) {
    fetch(`${parseUrl}/classes/OD3_Permission?where={%22key%22:%22openware:nodered%22}`, {
        method: 'GET',
        headers: {
            'X-Parse-Application-Id': parseAppId,
            'X-Parse-Session-Token': user.sessionToken
        },
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                if (data.results.length > 0) {
                    resolve({ username: user.username, permissions: "*" });
                } else {
                    console.log("User lacks required permissions");
                    resolve(null);
                }
            })
        } else {
            response.text().then(text => {
                console.log("Status code checking permissions:", response.status);
                console.log("Error checking user permissions:", text);
                resolve(null);
            });
        }
    }).catch(error => {
        console.error("Error checking user permissions:", error);
        resolve(null);
    });
}

module.exports = {
    type: "credentials",
    users: function (username) {
        return new Promise(function (resolve) {
            resolve({ username, permissions: "*" });
        });
    },
    authenticate: function (username, password) {
        return new Promise(function (resolve) {
            fetch(`${parseUrl}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                method: 'GET',
                headers: {
                    'X-Parse-Application-Id': parseAppId
                }
            }).then(response => {
                if (response.status !== 200) {
                    console.log("Authentication failed for user:", username, "status:", response.status);
                    return resolve(null);
                }
                response.json().then(user => {
                    checkUserPermissions(resolve, user);
                }).catch(error => {
                    console.error("Error parsing user data:", error);
                    resolve(null);
                });
            }).catch(error => {
                console.error("Error during authentication:", error);
                resolve(null);
            });
        });
    },
    tokens: function (token) {
        return new Promise(function (resolve) {
            fetch(`${parseUrl}/users/me`, {
                method: 'GET',
                headers: {
                    'X-Parse-Application-Id': parseAppId,
                    'X-Parse-Session-Token': token
                }
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(user => {
                        checkUserPermissions(resolve, user);
                    });
                } else {
                    resolve(null);
                }
            }).catch(error => {
                console.error("Error during token validation:", error);
                resolve(null);
            });
        });
    },
    default: function () {
        return new Promise(function (resolve) {
            resolve(null);
        });
    }
}

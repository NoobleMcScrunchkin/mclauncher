const https = require('https');
const fs = require('fs');
const launcher = require('./launcher.js');
const username = 'secret';
const password = 'secret';

function newToken(username, password) { //200 Valid, 403 Invalid username or password
    return new Promise((resolve, reject) => {
        let options = {
            hostname: "authserver.mojang.com",
            port: 443,
            path: '/authenticate',
            method: 'POST'
        }

        let auth = {
            'agent': {
                'name': 'Minecraft',
                'version': 1
            },
            'username': username,
            'password': password,
            'requestUser': true
        };

        let req = https.request(options, (res) => {
            res.on('data', d => {
                resolve({
                    status: res.statusCode,
                    data: JSON.parse(d)
                });
            });
        });

        req.on('error', e => {
            reject(e);
        });

        req.write(JSON.stringify(auth));
        req.end();
    }).catch(e => {console.log(e)});
}

function validateToken(accessToken, clientToken) { //True valid, False invalid
    return new Promise((resolve, reject) => {
        let options = {
            hostname: "authserver.mojang.com",
            port: 443,
            path: '/validate',
            method: 'POST'
        }

        let auth = {
            'accessToken': accessToken,
            'clientToken': clientToken,
        };

        let req = https.request(options, (res) => {
            if (res.statusCode == 204) {
                resolve(true)
            } else {
                resolve(false);
            }
        });

        req.on('error', e => {
            reject(e);
        });

        req.write(JSON.stringify(auth));
        req.end();
    }).catch(e => {console.log(e)});
}

function refreshToken(accessToken, clientToken) { //200 Valid, 403 Token does not exist
    return new Promise((resolve, reject) => {
        let options = {
            hostname: "authserver.mojang.com",
            port: 443,
            path: '/refresh',
            method: 'POST'
        }

        let auth = {
            'accessToken': accessToken,
            'clientToken': clientToken,
            'requestUser': true
        };

        let req = https.request(options, (res) => {
            res.on('data', d => {
                resolve({
                    status: res.statusCode,
                    data: JSON.parse(d)
                });
            });
        });

        req.on('error', e => {
            reject(e);
        });

        req.write(JSON.stringify(auth));
        req.end();
    }).catch(e => {console.log(e)});
}

function signout(username, password) { //204 Valid, 429 Incorrect username or password
    return new Promise((resolve, reject) => {
        let options = {
            hostname: "authserver.mojang.com",
            port: 443,
            path: '/signout',
            method: 'POST'
        }

        let auth = {
            'username': username,
            'password': password,
        };

        let req = https.request(options, (res) => {
            res.on('data', d => {
                console.log(d);
                resolve({
                    status: res.statusCode,
                    data: JSON.parse(d)
                });
            });
        });

        req.on('error', e => {
            reject(e);
        });

        req.write(JSON.stringify(auth));
        req.end();
    }).catch(e => {console.log(e)});
}

async function main() {
    // let login = await newToken(username, password);
    // console.log(login);
    // let valid = await validateToken(login.data.accessToken, login.data.clientToken);
    // console.log(valid);
    // let refresh = await refreshToken(login.data.accessToken, login.data.clientToken);
    // console.log(refresh);
    // let signoutres = await signout(username, password);
    // console.log(signoutres);
    // let gameDir = 'maybforge-36.1.0", login.data.selectedProfile.name, login.data.selectedProfile.id, login.data.accessToken, gameDir);
}

main();

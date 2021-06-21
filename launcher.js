const path = require("path");
const fs = require("fs");
const { exec } = require('child_process');

function getNativesString(library) {
    let arch;

    if (process.arch == "x64") {
        arch = "64";
    } else if (process.arch == "x32") {
        arch = "32";
    } else {
        console.error("Unsupported platform");
        process.exit(0);
    }

    let nativesFile = "";
    if (!("natives" in library)) {
        return nativesFile;
    }

    let opsys = process.platform;
    if (opsys == "darwin") {
        opsys = "MacOS";
    } else if (opsys == "win32" || opsys == "win64") {
        opsys = "Windows";
    } else if (opsys == "linux") {
        opsys = "Linux";
    }

    if ("windows" in library["natives"] && opsys == "Windows") {
        nativesFile = library["natives"]["windows"].replace('${arch}', arch);
    } else if ("osx" in library["natives"] && opsys == "MacOS") {
        nativesFile = library["natives"]["osx"].replace('${arch}', arch);
    } else if ("linux" in library["natives"] && opsys == "Linux") {
        nativesFile = library["natives"]["linux"].replace('${arch}', arch);
    } else {
        console.error("Unsupported platform");
        process.exit(0);
    }

    return nativesFile;
}

function ruleAllows(rule) {
    let uselib;

    if (rule["action"] == "allow") {
        useLib = false;
    } else {
        useLib = true;
    }

    let opsys = process.platform;
    if (opsys == "darwin") {
        opsys = "MacOS";
    } else if (opsys == "win32" || opsys == "win64") {
        opsys = "Windows";
    } else if (opsys == "linux") {
        opsys = "Linux";
    }

    if (rule["os"]) {
        if (rule["os"]["name"]) {
            let value = rule["os"]["name"];
            if (value == "windows" && opsys != 'Windows') {
                return useLib;
            }
            else if (value == "osx" && opsys != 'MacOS') {
                return useLib;
            }
            else if (value == "linux" && opsys != 'Linux') {
                return useLib;
            }
        }
        if (rule["os"]["arch"]) {
            if (rule["os"]["arch"] == "x86" && process.arch != "x32") {
                return useLib;
            }
        }
    }

    return !useLib;
}

function useLibrary(library) {
    if (!("rules" in library)) {
        return true;
    }

    for (let rule in library["rules"]) {
        if (ruleAllows(library["rules"][rule])) {
            return true;
        }
    }
    return false;
}

function getClasspath(clientJson, mcDir) {
    let classpath = [];

    clientJson["libraries"].forEach((library) => {
        if (!useLibrary(library)) {
            return;
        }

        let [libDomain, libName, libVersion] = library["name"].split(":");

        let jarPath = path.join(mcDir, "libraries", ...libDomain.split("."), libName, libVersion);

        let native = getNativesString(library);
        let jarFile = libName + "-" + libVersion + ".jar";

        if (native != ""){
            jarFile = libName + "-" + libVersion + "-" + native + ".jar";
        }
        classpath.push(path.join(jarPath, jarFile));
    });

    try {
        if (fs.existsSync(path.join(mcDir, "versions", clientJson["id"], `${clientJson["id"]}.jar`))) {
            classpath.push(path.join(mcDir, "versions", clientJson["id"], `${clientJson["id"]}.jar`));
        }
    } catch(err) {}

    return classpath.join(";");
}

module.exports = function(version, username, uuid, accessToken, gameDir) {
    let mcDir = "C:\\Users\\kiera\\AppData\\Roaming\\.minecraft";
    let nativesDir = path.join(mcDir, "versions", version, "natives");
    let clientJson = JSON.parse(fs.readFileSync(path.join(mcDir, "versions", version, `${version}.json`)));
    let classPath = getClasspath(clientJson, mcDir);
    let mainClass = clientJson["mainClass"];
    let versionType = clientJson["type"];
    let assets = path.join(mcDir, 'assets');
    let assetIndex;
    let inheritJson;

    if (clientJson["inheritsFrom"]) {
        let jsonPath = path.join(mcDir, "versions", clientJson["inheritsFrom"], `${clientJson["inheritsFrom"]}.json`);

        try {
            if (fs.existsSync(jsonPath)) {
                inheritJson = JSON.parse(fs.readFileSync(jsonPath));
            }
        } catch(err) {
            console.error(err)
        }

        classPath += ";" + getClasspath(inheritJson, mcDir);
        assetIndex = inheritJson["assetIndex"]["id"];
    } else {
        assetIndex = clientJson["assetIndex"]["id"];
    }

    let processCall = [
        'java',
        `-Djava.library.path=${nativesDir}`,
        '-Dminecraft.launcher.brand=custom-launcher',
        '-Dminecraft.launcher.version=2.1',
        '-cp',
        classPath,
        clientJson["mainClass"],
        '--username',
        username,
        '--version',
        version,
        '--gameDir',
        gameDir,
        '--assetsDir',
        assets,
        '--assetIndex',
        assetIndex,
        '--uuid',
        uuid,
        '--accessToken',
        accessToken,
        '--userType',
        'mojang',
        '--versionType',
        'release',
    ]

    if (clientJson["arguments"]["game"]) {
        clientJson["arguments"]["game"].forEach((arg) => {
            if (typeof arg == "string" && !processCall.includes(arg) && !arg.includes("$")) {
                processCall.push(arg);
            }
        });
    }
    if (inheritJson && inheritJson["arguments"]["game"]) {
        inheritJson["arguments"]["game"].forEach((arg) => {
            if (typeof arg == "string" && !processCall.includes(arg) && !arg.includes("$")) {
                processCall.push(arg);
            }
        });
    }

    console.log(processCall.join(" "));

    // const javaRuntime = exec(processCall.join(" "), function (error, stdout, stderr) {
    //   if (error) {
    //     console.log(error.stack);
    //     console.log('Error code: '+error.code);
    //     console.log('Signal received: '+error.signal);
    //   }
    //   console.log(stdout);
    //   console.log(stderr);
    // });
}

/*
JSON {
    libraries {
        name (net:mojang/fabric etc:jarname:version)
        url (base url (net:fabric/mojang/etc:jarname/version/jarname-version.jar))
        #############
        name
        downloads {
            artifact {
                path (where it goes in the libraries folder)
                sha1
                size
                url (direct url?)
            }
        }
    }
}

TODO:
- Download required libraries
- Check which java version to use
- Move from default minecraft dir
    - Auto download version manifest (https://launchermeta.mojang.com/mc/game/version_manifest_v2.json)
    - Download version files
        - Json url in manifest
        - Jar url in version json
    - Download Asset Indexes (url in version json)
- Instance Manager?
    - Seperate mcDir for each Instance
    - Mod manager?
- UI
*/

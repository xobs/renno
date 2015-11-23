fs = require('fs');
os = require('os');

RennoPackage = require("./renno-package.js");
RennoToolchain = require("./renno-toolchain.js");
RennoPlatform = require("./renno-platform.js");

module.exports = function() {
    this._packages = new Object();
    this._projects = new Object();
    this._boards = new Object();
    this._platforms = new Object();

    this._package_provides = new Object();

    this._toolchains = new Object();
    this._toolchain_map = new Object();

    this.addPath = function() {
        for (var i = 0; i < arguments.length; i++) {
            var path = arguments[i];
            files = fs.readdirSync(path);

            for (var j = 0; j < files.length; j++) {
                var candidate = path + "/" + files[j];
                if (candidate.endsWith(".rennopkg")) {
                    newPackage = new RennoPackage(candidate, this);
                    if (newPackage.name() in this._packages) {
                        throw "Package " + newPackage.name() + " already loaded!  Fixme.";
                    }
                    this._packages[newPackage.name()] = newPackage;

                    /* Add this package to a reverse-lookup for providing */
                    for (provide in newPackage.provides()) {
                        if (!(provide in this._package_provides))
                            this._package_provides[provide] = new Array();
                        this._package_provides[provide].push(newPackage);
                    }
                }
                else if (candidate.endsWith(".rennoplat")) {
                    newPlatform = new RennoPlatform(candidate, this);
                    if (newPlatform.name() in this._platforms) {
                        throw "Platform " + newPlatform.name() + " already loaded!  Fixme.";
                    }
                    this._platforms[newPlatform.name()] = newPlatform;
                }
                else if (candidate.endsWith(".rennoproj")) {
                    ;
                }
                else if (candidate.endsWith(".rennoboard")) {
                    ;
                }
                else if (candidate.endsWith(".rennotoolchain")) {
                    newToolchain = new RennoToolchain(candidate, this);

                    if (newToolchain.host() != this.platform()) {
                        console.log("Skipping %s from %s, as it's not for %s", newToolchain.name(), candidate, this.platform());
                        continue;
                    }

                    this._toolchains[newToolchain.name()] = newToolchain;

                    archNames = newToolchain.archNames();
                    for (var k = 0; k < archNames.length; k++) {
                        var archName = archNames[k]
                        if (archName in this._toolchain_map) {
                            console.warn("There is already a toolchain for %s, skipping", archName);
                            continue;
                        }
                        this._toolchain_map[archName] = newToolchain;
                    }
                }
            }
        };
    };

    this.allPackages = function() {
        return this._packages;
    };

    this.allPlatforms = function() {
        return this._platforms;
    };

    this.getPackage = function(name) {
        return this._packages[name];
    };

    this.getPlatform = function(name) {
        return this._platforms[name];
    }

    /*
    Get a list of packages that satisfy "names".  When there is a conflict, or when
    multiple packages provide a single dependency, resolve the conflict using
    "mapping".
    If the mapping cannot be satisfied, and if pickRandomly is True, then pick a
    package at random.  Otherwise, raise an exception.
    The ignore property is used internally, to recursively find dependencies
    */
    this.getPackages = function(names, mapping, pickRandomly, ignore) {
        var output = new Array();

        if (ignore == undefined)
            ignore = new Object();

        console.log("Resolving packages: %s", names.join(", "));

        for (pkgName in names) {
            if (pkgName in ignore)
                continue;

            if (!(pkgName in this._package_provides))
                throw "Unable to find package named " + pkgName;

            var foundPkg = null;
            candidates = this._package_provides[pkgName];

            if ((mapping != null) && (pkgName in mapping)) {
                foundPkg = self.getPackage(mapping[pkgName]);
                console.log("Mapping resolved %s to %s", pkgName, foundPkg.name());
            }

            else if (candidates.length == 0) {
                throw "Candidates array is empty";
            }

            else if (candidates.length == 1) {
                console.log("Package %s is the only candidate", candidates[0].name());
                foundPkg = candidates[0];
            }

            else if ((foundPkg == null) && pickRandomly) {
                foundPkg = candidates[Math.floor(Math.random() * candidates.length)];
                console.log("Randomly resolved to %s", foundPkg.name())
            }

            else {
                var candidateNames = new Array();
                for (pkg in candidates)
                    candidateNames.push(pkg.name());
                throw "Multiple packages satisfy dependency '" + pkgName + "': " + candidateNames.join(", ");
            }
            ignore[pkgName] = true;
            ignore[foundPkg.name()] = true;
            output.push(foundPkg);

            extras = this.getPackages(foundPkg.runDepends(), mapping, pickRandomly, ignore);
            for (item in extras)
                output.push(item);
        }

        return output;
    }

    this.getToolchain = function(arch) {
        if (arch in this._toolchain_map)
            return this._toolchain_map[arch];
        throw "Unable to locate toolchain for arch: '" + arch + "'";
    };

    this.defaultCArgs = function(arch) {
        return this.getToolchain(arch).cArgs(arch).slice();
    };

    this.defaultCxxArgs = function(arch) {
        return this.getToolchain(arch).cxxArgs(arch).slice();
    };

    this.defaultAsArgs = function(arch) {
        return this.getToolchain(arch).asArgs(arch).slice();
    };

    this.defaultLdArgs = function(arch) {
        return this.getToolchain(arch).ldArgs(arch).slice();
    };

    this.defaultArArgs = function(arch) {
        return this.getToolchain(arch).arArgs(arch).slice();
    };

    this.platform = function() {
        return this._platform;
    };

    if (os.platform() == "win32")
        this._platform = "windows";
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

if (typeof String.prototype.padLeft !== 'function') {
    String.prototype.padLeft = function(targetLength) {

        var diff = targetLength - this.length;
        var filler = ' ';
        var newStr = this;

        for (var i = 0; i < diff; i++) {
            newStr = filler + newStr;
        }
        return newStr;
    };
}

if (typeof String.prototype.padRight !== 'function') {
    String.prototype.padRight = function(targetLength) {

        var diff = targetLength - this.length;
        var filler = ' ';
        var newStr = this;

        for (var i = 0; i < diff; i++) {
            newStr = newStr + filler;
        }
        return newStr;
    };
}

var fs = require('fs-extra');
var jspath = require('path');
var child_process = require('child_process');

var RennoPlatformConfiguration = function(platform, config_name, conf) {

    this.name = function() {
        return this._name;
    };

    this.type = function() {
        return this._type;
    };

    this.arch = function() {
        return this._arch;
    };

    this.defs = function() {
        return this._defs;
    };

    this.script = function() {
        return this._script;
    };

    this.libs = function() {
        return this._libs;
    };

    this.entry = function() {
        return this._entry;
    };

    this.platform = function() {
        return this._platform;
    };

    this.configurationPath = function() {
        return this.platform().path() + jspath.sep + "Configurations" + jspath.sep + this.name() + jspath.sep;
    };

    this._name = config_name;
    this._platform = platform;
    this._arch = conf.arch;

    if ("entry" in conf)
        this._entry = conf.entry;
    else
        this._entry = "";

    if ("script" in conf)
        this._script = conf.script;
    else
        this._script = "";

    this._defs = new Array();
    if ("defs" in conf)
        for (def in conf.defs)
            this._defs.push(def);

    this._libs = new Object();
    if ("libs" in conf) {
        for (lib in conf.libs)
            this._libs[lib] = conf.libs[lib];
    }
};

module.exports = function(path, manager) {

    this.manager = function() {
        return this._manager;
    };

    this.name = function() {
        return this._name;
    };

    this.description = function() {
        return this._description;
    };

    this.path = function() {
        return this._path;
    };

    this.version = function() {
        return this._version;
    };

    this.defs = function() {
        return this._defs;
    };

    this.configurations = function() {
        return this._configurations;
    };

    this.configuration = function(name) {
        return this._configurations[name];
    };

    this.configurationPrefix = function() {
        return this._path + jspath.sep + "Configurations" + jspath.sep;
    };

    this.sourcePrefix = function() {
        return this._path + jspath.sep + "Source" + jspath.sep;
    };

    this.tempPrefix = function() {
        return os.tmpdir() + jspath.sep + "rennobuild" + jspath.sep;
    };

    this.build = function() {
        for (configName in this.configurations()) {
            var config = this.configurations()[configName];
            var toolchain = manager.getToolchain(config.arch());

            console.log("Building for configuratoin %s", configName);

            var cArgsBase = this.manager().defaultCArgs(config.arch());
            var cxxArgsBase = this.manager().defaultCxxArgs(config.arch());
            var asArgsBase = this.manager().defaultAsArgs(config.arch());
            var defsBase = new Array();
            var incBase = new Array();

            for (def in this.defs())
                defsBase.push("-D" + def);
            for (def in config.defs())
                defsBase.push("-D" + def);

            for (libName in config.libs()) {
                lib = config.libs()[libName];

                var cArgs = cArgsBase.slice();
                var cxxArgs = cxxArgsBase.slice();
                var asArgs = asArgsBase.slice();
                var defs = defsBase.slice();
                var inc = incBase.slice();

                if ("defs" in lib)
                    for (def in lib.defs)
                        defs.push("-D" + def);
                if ("include" in lib) {
                    for (incpath in lib.include)
                        inc.push("-I" + this.sourcePrefix() + incpath);
                }
                else
                    inc.push("-I" + this.sourcePrefix());

                var objFiles = new Array();

                if ("csrcs" in lib) {
                    for (var csrcNum = 0; csrcNum < lib.csrcs.length; csrcNum++) {
                        csrc = lib.csrcs[csrcNum];
                        fs.mkdirpSync(this.tempPrefix() + jspath.dirname(csrc));
                        objFile = this.tempPrefix() + jspath.basename(csrc, ".c") + ".o";
                        csrc = this.sourcePrefix() + csrc;

                        args = new Array();
                        cArgs.forEach(function(a) { args.push(a); });
                        defs.forEach(function(a) { args.push(a); });
                        inc.forEach(function(a) { args.push(a); });
                        args.push(csrc)
                        args.push("-o")
                        args.push(objFile)
                        console.log(toolchain.cCompiler(config.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.cCompiler(config.arch()),
                                    args);
                        }
                        catch(e) {
                            console.log("Failed to compile: %s", e);
                            throw e;
                        }
                        objFiles.push(objFile);
                    }
                }
                if ("asrcs" in lib) {
                    for (var asrcNum = 0; asrcNum < lib.asrcs.length; asrcNum++) {
                        asrc = lib.asrcs[asrcNum];
                        fs.mkdirpSync(this.tempPrefix() + jspath.dirname(asrc));
                        objFile = this.tempPrefix() + jspath.basename(asrc, ".s") + ".o";
                        asrc = this.sourcePrefix() + asrc;

                        args = new Array();
                        asArgs.forEach(function(a) { args.push(a); });
                        defs.forEach(function(a) { args.push(a); });
                        inc.forEach(function(a) { args.push(a); });
                        args.push(asrc)
                        args.push("-o")
                        args.push(objFile)
                        console.log(toolchain.assembler(config.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.assembler(config.arch()),
                                    args);
                        }
                        catch(e) {
                            console.log("Failed to assemble: %s", e);
                            throw e;
                        }
                        objFiles.push(objFile);
                    }
                }
                if ("cxxsrcs" in lib) {
                    for (var cxxsrcNum = 0; cxxsrcNum < lib.cxxsrcs.length; cxxsrcNum++) {
                        cxxsrc = lib.cxxsrcs[cxxsrcNum];
                        fs.mkdirpSync(this.tempPrefix() + jspath.dirname(cxxsrc));
                        objFile = this.tempPrefix() + jspath.basename(cxxsrc, ".cpp") + ".o";
                        cxxsrc = this.sourcePrefix() + cxxsrc;

                        args = new Array();
                        cxxArgs.forEach(function(a) { args.push(a); });
                        defs.forEach(function(a) { args.push(a); });
                        inc.forEach(function(a) { args.push(a); });
                        args.push(cxxsrc)
                        args.push("-o")
                        args.push(objFile)
                        console.log(toolchain.cxxCompiler(config.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.cxxCompiler(config.arch()),
                                    args);
                        }
                        catch(e) {
                            console.log("Failed to compile: %s", e);
                            throw e;
                        }
                        objFiles.push(objFile);
                    }
                }

                /* Archive all object files into a .a library */
                args = new Array();
                toolchain.arArgs(config.arch()).forEach(function(a) { args.push(a); });
                args.push(this.path() + jspath.sep + "Configurations" + jspath.sep + configName + jspath.sep + "lib" + this.name() + "-" + libName + ".a");
                objFiles.forEach(function(a) { args.push(a); });
                console.log(toolchain.archiver(config.arch()) + " " + args.join(" "));

                try {
                    child_process.spawnSync(
                        toolchain.archiver(config.arch()),
                        args);
                }
                catch(e) {
                    throw "Archiver returned error: " + e;
                }
            }
        }
    };

    candidateFiles = [
        "Platform.conf",
        "Platform.json",
        "Renno.conf",
        "Renno.json"
    ];

    this._path = path;
    this._manager = manager;
    conf = null;

    for (var i = 0; (i < candidateFiles.length) && (conf == null); i++) {
        var candidateFile = candidateFiles[i];

        try {
            if (fs.statSync(path + jspath.sep + candidateFile).isFile()) {
                conf = JSON.parse(fs.readFileSync(path + jspath.sep + candidateFile, 'utf8'));
            }
        }
        catch(err) {
            ;
        }
    }

    if (!conf)
        throw "Unable to read file";

    this._name = conf.name;
    this._description = conf.description;
    this._version = conf.version;

    this._defs = new Array();
    if ("defs" in conf)
        for (def in conf.defs)
            this._defs.push(def);

    this._configurations = new Object();
    for (configurationName in conf.configurations) {
        var configuration = conf.configurations[configurationName];
        var confObj = new RennoPlatformConfiguration(this, configurationName, configuration);
        if (!fs.statSync(this.configurationPrefix() + configurationName + jspath.sep + confObj.script()).isFile())
            throw "Script " + confObj.script() + " not found in " + this.configurationPrefix() + configurationName;

        this._configurations[configurationName] = confObj;
    }
};

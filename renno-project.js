var fs = require('fs-extra');
var jspath = require('path');
var child_process = require('child_process');

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

    this.depends = function() {
        return this._depends;
    };

    this.dependencyMap = function() {
        return this._dependencyMap;
    };

    this.headers = function() {
        return this._headers;
    };

    this.boardName = function() {
        return this._boardName;
    };

    this.board = function() {
        if (this._board == undefined)
            this._board = this.manager().getBoard(this.boardName());
        return this._board;
    };

    this.platformName = function() {
        return this._platformName;
    };

    this.platform = function() {
        if (this._platform == undefined)
            this._platform = this.manager().getPlatform(this.platformName());
        return this._platform;
    };

    this.configurationName = function() {
        return this._configurationName;
    };

    this.configuration = function() {
        if (this._configuration == undefined)
            this._configuration = this.platform().configuration(this.configurationName());
        return this._configuration;
    }

    this.sourcePrefix = function() {
        return this._path + jspath.sep + "Source" + jspath.sep;
    };

    this.tempPrefix = function() {
        return os.tmpdir() + jspath.sep + "rennobuild" + jspath.sep;
    };

    this.build = function(outPath) {
        var platform = this.platform();
        var config = this.configuration();
        var board = this.board();
        var archName = config.arch();
        var platformName = platform.name();
        var toolchain = this.manager().getToolchain(archName);

        var libs = new Array();
        var defs = new Array();
        var inc = new Array();

        var pkgs = this.manager().getPackages(this.depends(), this.dependencyMap(), false);
        for (var pkgNum = 0; pkgNum < pkgs.length; pkgNum++) {
            var pkg = pkgs[pkgNum];
            for (def in pkg.runDefs())
                defs.push("-D" + def);
            for (incpath in pkg.runInclude())
                inc.push("-I" + pkg.headerPrefix() + incpath);
            for (lib in pkg.runLibs())
                libs.push(pkg.libraryPath(archName, platformName, this.boardName()) + "lib" + pkg.name() + "-" + lib + ".a")
        }

        for (def in platform.defs())
            defs.push("-D" + def);

        for (def in config.defs())
            defs.push("-D" + def);

//        for (def in board.defs())
//            defs.push("-D" + def);

        for (lib in config.libs())
            libs.push(config.configurationPath() + "lib" + platform.name() + "-" + lib + ".a")

        var objFiles = new Array();

        if ("_csrcs" in this) {
            for (var csrcNum = 0; csrcNum < this._csrcs.length; csrcNum++) {
                csrc = this._csrcs[csrcNum];
                fs.mkdirpSync(this.tempPrefix() + jspath.dirname(csrc));
                objFile = this.tempPrefix() + jspath.basename(csrc, ".c") + ".o";
                csrc = this.sourcePrefix() + csrc;

                args = toolchain.cArgs(config.arch()).slice();
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
        if ("_asrcs" in this) {
            for (var asrcNum = 0; asrcNum < this._asrcs.length; asrcNum++) {
                asrc = this._asrcs[asrcNum];
                fs.mkdirpSync(this.tempPrefix() + jspath.dirname(asrc));
                objFile = this.tempPrefix() + jspath.basename(asrc, ".s") + ".o";
                asrc = this.sourcePrefix() + asrc;

                args = toolchain.asArgs(config.arch()).slice();
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
        if ("_cxxsrcs" in this) {
            for (var cxxsrcNum = 0; cxxsrcNum < this._cxxsrcs.length; cxxsrcNum++) {
                cxxsrc = this._cxxsrcs[cxxsrcNum];
                fs.mkdirpSync(this.tempPrefix() + jspath.dirname(cxxsrc));
                objFile = this.tempPrefix() + jspath.basename(cxxsrc, ".cpp") + ".o";
                cxxsrc = this.sourcePrefix() + cxxsrc;

                args = toolchain.cxxArgs(config.arch()).slice();
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

        /* Link everything together into an .elf file */
        args = toolchain.ldArgs(config.arch()).slice();
        args.push("-static");
        if (config.script() != "")
            args.push("-Wl,--script=" + platform.path() + jspath.sep + "Configurations" + jspath.sep + config.name() + jspath.sep + config.script());
        if (config.entry() != "")
            args.push("-Wl,--entry=" + config.entry());
        args.push("-Wl,-Map=" + outPath + jspath.sep + this.name() + ".map");
        libs.forEach(function(a) { args.push(a); });
        objFiles.forEach(function(a) { args.push(a); });
        args.push("-o");
        args.push(outPath + jspath.sep + this.name() + ".elf");
        console.log(toolchain.assembler(config.arch()) + " " + args.join(" "));

        try {
            child_process.spawnSync(
                toolchain.assembler(config.arch()),
                args);
        }
        catch(e) {
            throw "Assembler returned error: " + e;
        }
    };

    candidateFiles = [
        "Project.conf",
        "Project.json",
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

    this.readConfArray = function(conf, type) {
        this["_" + type] = new Array();
        if (type in conf)
            for (val in conf[type])
                this["_" + type].push(conf[type][val]);
    };

    this.readConfArray(conf, "csrcs");
    this.readConfArray(conf, "cxxsrcs");
    this.readConfArray(conf, "asrcs");
    this.readConfArray(conf, "headers");
    this.readConfArray(conf, "depends");
    this.readConfArray(conf, "defs");

    if ("board" in conf)
        this._boardName = conf.boardName;
    else
        this._boardName = "";

    if ("dependencymap" in conf)
        this._dependencyMap = conf.dependencymap;
    else
        this._dependencyMap = new Object();

    this._platformName = conf.platform;
    this._configurationName = conf.configuration;
};

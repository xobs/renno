var fs = require('fs-extra');
var jspath = require('path');
var child_process = require('child_process');

var RennoBuildTarget = function(name, conf) {

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

    this.include = function() {
        return this._include;
    };

    this._name = name;
    this._arch = conf.arch;

    if (conf.type == "arch")
        this._type = "arch";
    else if (conf.type == "platform")
        this._type = "platform";
    else if (conf.type == "board")
        this._type = "board";
    else
        throw "Unrecognized target type: " + conf.type;

    if ("defs" in conf)
        this._defs = conf.defs;
    else
        this._defs = new Array();

    if ("include" in conf)
        this._include = conf.include;
    else
        this._include = new Array();
}

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

    this.arches = function() {
        return this._arches;
    };

    this.platforms = function() {
        return this._platforms;
    };

    this.boards = function() {
        return this._boards;
    };

    this.buildTargets = function() {
        return this._build_targets;
    };

    this.buildLibs = function() {
        return this._build_libs;
    }

    this.buildDepends = function() {
        return this._build_depends;
    };

    this.buildDefs = function() {
        return this._build_defs;
    };

    this.buildInclude = function() {
        return this._build_include;
    };

    this.buildHeaders = function() {
        return this._build_headers;
    };

    this.runDepends = function() {
        return this._run_depends;
    };

    this.runDefs = function() {
        return this._run_defs;
    };

    this.runInclude = function() {
        return this._run_include;
    };

    this.runLibs = function() {
        return this._run_libs;
    };

    this.provides = function() {
        return this._run_provides;
    };

    this.libraryPrefix = function() {
        return this._path + jspath.sep + "Libraries" + jspath.sep;
    };

    this.sourcePrefix = function() {
        return this._path + jspath.sep + "Source" + jspath.sep;
    };

    this.headerPrefix = function() {
        return this._path + jspath.sep + "Headers" + jspath.sep;
    };

    this.tempPrefix = function() {
        return os.tmpdir() + jspath.sep + "rennobuild" + jspath.sep;
    };

    this.isDirectory = function(path) {
        try {
            if (fs.statSync(path).isDirectory())
                return true;
        }
        catch (e) {
            ;
        }
        return false;
    };

    this.libraryPath = function(arch, plat, board) {
        var basePath = this.libraryPrefix();

        var candidates = [
            basePath + "board" + jspath.sep + board + jspath.sep,
            basePath + "platform" + jspath.sep + plat + jspath.sep,
            basePath + "arch" + jspath.sep + arch + jspath.sep
        ];

        if ((board != null) && (board != "") && this.isDirectory(candidates[0]))
            return candidates[0];
        if ((plat != null) && (plat != "") && this.isDirectory(candidates[1]))
            return candidates[1];
        if ((arch != null) && (arch != "") && this.isDirectory(candidates[2]))
            return candidates[2];
        throw "Library not found for arch: " + arch + ", platform: " + plat + ", board: " + board;
    };

    this.createLibraryDir = function(name, type) {
        var p = this.path() + jspath.sep + "Libraries" + jspath.sep + type + jspath.sep + name;
        try {
            if (fs.statSync(p).isDirectory())
                return;
        }
        catch (e) {
            ;
        }
        fs.mkdirpSync(p);
    };

    this.createHeaderDir = function(name, type) {
        var p = this.headerPrefix();
        try {
            if (fs.statSync(p).isDirectory())
                return;
        }
        catch (e) {
            ;
        }
        fs.mkdirpSync(p);
    };

    this.readArray = function(conf, key, type) {
        this["_" + type + "_" + key] = new Array();
        if (key in conf[type]) {
            for (var element in conf[type][key]) {
                this["_" + type + "_" + key].push(conf[type][key][element]);
            }
        }
    };

    this.readBuildArray = function(conf, key) {
        return this.readArray(conf, key, "build");
    };

    this.readRunArray = function(conf, key) {
        return this.readArray(conf, key, "run");
    };

    this.readRunDict = function(conf, key) {
        return this.readDict(conf, key, "run");
    };

    this.build = function() {
        console.log("Building %s", this.name());
        var targets = this.buildTargets();
        var libs = this.buildLibs();

        for (targetName in targets) {
            var target = targets[targetName];
            var toolchain = manager.getToolchain(target.arch());

            console.log("Building for target %s", targetName);

            var cArgsBase = this.manager().defaultCArgs(target.arch());
            var cxxArgsBase = this.manager().defaultCxxArgs(target.arch());
            var asArgsBase = this.manager().defaultAsArgs(target.arch());
            var defsBase = new Array();
            var incBase = new Array();

            for (def in this.buildDefs())
                defsBase.push("-D" + def);

            for (incdir in this.buildInclude())
                incBase.push("-I" + this.sourcePrefix() + incdir);

            if (target.type() == "platform") {
                platform = this.manager().getPlatform(target.name());
                for (def in platform.defs())
                    defBase.push("-D" + def);
            }

            for (libName in libs) {
                lib = libs[libName];

                var cArgs = cArgsBase.slice();
                var cxxArgs = cxxArgsBase.slice();
                var asArgs = asArgsBase.slice();
                var defs = defsBase.slice();
                var inc = incBase.slice();

                for (def in target.defs())
                    defs.push("-D" + def);
                for (incpath in target.include())
                    inc.push("-I" + this.sourcePrefix() + incpath);
                if ("defs" in lib)
                    for (def in lib.defs)
                        defs.push("-D" + def);
                if ("include" in lib) {
                    for (incpath in lib.include)
                        inc.push("-I" + this.sourcePrefix() + incpath);
                }
                else
                    inc.push("-I" + this.sourcePrefix());

                pkgs = this.manager().getPackages(this.buildDepends(), null, true);
                for (var pkgNum = 0; pkgNum < pkgs.length; pkgNum++) {
                    var pkg = pkgs[pkgNum];
                    for (def in pkg.runDefs())
                        defs.push("-D" + def);
                    for (incpath in pkg.runInclude())
                        inc.push("-I" + pkg.headerPrefix() + incpath);
                }

                var objFiles = new Array();

                if ("csrcs" in lib) {
                    for (var csrcNum = 0; csrcNum < lib.csrcs.length; csrcNum++) {
                        csrc = lib.csrcs[csrcNum];
                        console.log("Building %s", csrc);
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
                        console.log(toolchain.cCompiler(target.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.cCompiler(target.arch()),
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
                        console.log("Building %s", asrc);
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
                        console.log(toolchain.assembler(target.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.assembler(target.arch()),
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
                        console.log("Building %s", cxxsrc);
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
                        console.log(toolchain.cxxCompiler(target.arch()) + " " + args.join(" "));

                        try {
                            p = child_process.spawnSync(
                                    toolchain.cxxCompiler(target.arch()),
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
                this.createLibraryDir(targetName, target.type());
                args = new Array();
                toolchain.arArgs(target.arch()).forEach(function(a) { args.push(a); });
                args.push(this.path() + jspath.sep + "Libraries" + jspath.sep + target.type() + jspath.sep + targetName + jspath.sep + "lib" + this.name() + "-" + libName + ".a");
                objFiles.forEach(function(a) { args.push(a); });
                console.log(toolchain.archiver(target.arch()) + " " + args.join(" "));

                try {
                    child_process.spawnSync(
                        toolchain.archiver(target.arch()),
                        args);
                }
                catch(e) {
                    throw "Archiver returned error: " + e;
                }
            }
        }

        this.createHeaderDir();

        for (headerNum = 0; headerNum < this.buildHeaders().length; headerNum++) {
            var header = this.buildHeaders()[headerNum];

            if (fs.statSync(this.sourcePrefix() + header).isDirectory()) {
                if (header.endsWith("/")) {
                    file.walkSync(header, function(dirName, subdirList, fileList) {
                        dirName = dirName.replace(this.sourcePrefix() + header, "");
                        for (fname in fileList) {
                            if (fname.endsWith(".h") || fname.endsWith(".H")) {
                                fs.mkdirpSync(this.headerPrefix() + header + dirName);
                                fs.copy(this.sourcePrefix() + header + jspath.sep + dirName + jspath.sep + fname,
                                        this.headerPrefix() + header + jspath.sep + dirName + jspath.sep + fname,
                                        function(err) { return; });
                            }
                        }
                    });
                }
                else {
                    console.log("Copying headers from directory [[%s]] / [[%s]]", this.sourcePrefix(), header);
                    fileList = fs.readdirSync(this.sourcePrefix() + header);
                    for (fname in fileList) {
                        if (fname.endsWith(".h") || fname.endsWith(".H")) {
                            console.log("Fname: %s  dirname: %s", fname, header)
                            fs.mkdirpSync(this.headerPrefix() + header);
                            console.log("Copying header: %s", header + jspath.sep + fname);
                            fs.copy(this.sourcePrefix() + header + jspath.sep + fname,
                                    this.headerPrefix() + header + jspath.sep + fname,
                                    function(err) { return; });
                        }
                    }
                }
            }
            else {
                console.log("Copying header %s to %s", this.sourcePrefix() + header, this.headerPrefix() + jspath.dirname(header));
                fs.mkdirpSync(this.headerPrefix() + jspath.dirname(header))
                fs.copy(this.sourcePrefix() + header, this.headerPrefix() + header, function(err) { return; });
            }
        }
    };

    candidateFiles = [
        "Package.conf",
        "Package.json",
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

    if ("build" in conf) {
        this._build_targets = new Array();
        for (targetName in conf.build.targets) {
            this._build_targets[targetName] = new RennoBuildTarget(targetName, conf.build.targets[targetName]);
        }
        this._build_libs = new Object();
        for (libName in conf.build.libs) {
            this._build_libs[libName] = conf.build.libs[libName];
        }
        this.readBuildArray(conf, "headers");
        this.readBuildArray(conf, "defs");
        this.readBuildArray(conf, "include");
        this.readBuildArray(conf, "depends");
    }

    this.readRunArray(conf, "libs");
    this.readRunArray(conf, "defs");
    this.readRunArray(conf, "include");
    this.readRunArray(conf, "depends");

    this._run_provides = new Array(this.name());
    if ("provides" in conf.run)
        for (idx in conf.run.provides)
            this._run_provides.push(conf.run.provides[idx]);

    if ("libs" in conf.run)
        this._run_libs = conf.run.libs;
    else
        this._run_libs = new Object();

    try {
        this._arches = fs.readdirSync(this.libraryPrefix() + "arch");
    }
    catch(e) {
        this._arches = Array();
    }

    try {
        this._platforms = fs.readdirSync(this.libraryPrefix() + "platform");
    }
    catch(e) {
        this._platforms = Array();
    }

    try {
        this._boards = fs.readdirSync(this.libraryPrefix() + "board");
    }
    catch(e) {
        this._boards = Array();
    }
}

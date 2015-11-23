var fs = require('fs');

module.exports = function(path, manager) {

    this.name = function() {
        return this._name;
    };

    this.description = function() {
        return this._description;
    };

    this.version = function() {
        return this._version;
    };

    this.host = function() {
        return this._host;
    };

    this.archNames = function() {
        return this._archNames;
    };

    this.args = function(archName) {
        return this._arches[archName].args;
    };

    this.cArgs = function(archName) {
        return this._arches[archName].cargs;
    };

    this.cxxArgs = function(archName) {
        return this._arches[archName].cxxargs;
    };

    this.asArgs = function(archName) {
        return this._arches[archName].asargs;
    };

    this.ldArgs = function(archName) {
        return this._arches[archName].ldargs;
    };

    this.arArgs = function(archName) {
        return this._arches[archName].arargs;
    };

    this.cCompiler = function(archName) {
        return this._c_compiler;
    };

    this.cxxCompiler = function(archName) {
        return this._cxx_compiler;
    };

    this.assembler = function(archName) {
        return this._assembler;
    };

    this.linker = function(archName) {
        return this._linker;
    };

    this.archiver = function(archName) {
        return this._archiver;
    };

    this._path = path;
    this._manager = manager;
    conf = null;

    candidateFiles = [
        "Toolchain.conf",
        "Toolchain.json"
    ];

    conf = null;

    for (var i = 0; (i < candidateFiles.length) && (conf == null); i++) {
        var candidateFile = candidateFiles[i];

        try {
            if (fs.statSync(path + "/" + candidateFile).isFile()) {
                conf = JSON.parse(fs.readFileSync(path + "/" + candidateFile, 'utf8'));
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
    this._host = conf.host;
    this._url = conf.url;

    this._c_compiler = conf.programs["c-compiler"];
    this._cxx_compiler = conf.programs["cxx-compiler"];
    this._assembler = conf.programs["assembler"];
    this._archiver = conf.programs["archiver"];
    this._linker = conf.programs["linker"];

    this._arches = new Object();
    this._archNames = new Array();

    for (var archName in conf.architectures) {
        if (!conf.architectures.hasOwnProperty(archName))
            continue;
        var archConf = conf.architectures[archName];
        var arch = new Object();

        arch.args = new Array();
        if ("args" in archConf)
            arch.args = archConf.args;

        arch.cargs = arch.args.slice();
        if ("cargs" in archConf)
            arch.cargs = arch.args.concat(archConf["cargs"]);

        arch.cxxargs = arch.args.slice();
        if ("cxxargs" in archConf)
            arch.cxxargs = arch.args.concat(archConf["cxxargs"]);

        arch.asargs = arch.args.slice();
        if ("asargs" in archConf)
            arch.asargs = arch.args.concat(archConf["asargs"]);

        arch.ldargs = arch.args.slice();
        if ("ldargs" in archConf)
            arch.ldargs = arch.args.concat(archConf["ldargs"]);

        arch.arargs = new Array();
        if ("arargs" in archConf)
            arch.arargs = arch.arargs.concat(archConf["arargs"]);

        this._archNames.push(archName);
        this._arches[archName] = arch;
    }
};

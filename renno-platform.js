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

    if ("script" in conf)
        this._script = conf.script;

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

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

    candidateFiles = [
        "Board.conf",
        "Board.json",
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
};

'use strict';
// core
const Module = require('module');
const fs = require('fs');
const path = require('path');

process.argv[0] = process.execPath = process.execPath.replace(/\bnodeImpl[.]exe$/, 'node');

const isCygwin = process.platform === 'win32' && (process.env.ORIGINAL_PATH || '').indexOf('/cygdrive/') !== -1;
if (!isCygwin) {
    throw new Error('Cygwin Only');
}

const patches = {};
const base = path.resolve(__dirname, 'cygnode_modules');
function collectPatches(dir) {
    fs.readdirSync(dir).forEach((entry) => {
        const entryPath = path.join(dir, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
            collectPatches(entryPath);
            return;
        }
        let key = path.relative(base, entryPath);
        if (key.indexOf(path.sep) !== -1) {
            key = path.sep + path.join('node_modules', key);
        }
        patches[key] = require(entryPath);
    });
}
collectPatches(base);

function findModuleByModuleExports(moduleExports) {
    const ids = Object.keys(require.cache);
    for (let i = 0; i < ids.length; ++i) {
        const id = ids[i];
        if (!require.cache[id]) { // bypass module caching e.g. require-uncached
            continue;
        }
        if (require.cache[id].exports === moduleExports) {
            return require.cache[id];
        }
    }
    // core module
    return moduleExports;
}

const moduleRequire = Module.prototype.require;
Module.prototype.require = function (request) {
    const moduleExports = moduleRequire.apply(this, arguments);
    const moduleObject = findModuleByModuleExports(moduleExports);
    if (moduleObject.__CYGWIN__) {
        return moduleExports;
    }
    Object.defineProperty(moduleObject, '__CYGWIN__', {value: true});

    Object.keys(patches)
        .filter((key) => moduleObject.id.endsWith(key))
        .forEach((key) => patches[key](moduleObject));

    return moduleExports;
};

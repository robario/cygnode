'use strict';
// core
const childProcess = require('child_process');
const path = require('path');
// local
const debug = require('./debug.js');

const OPTION_MAP = {
    // Output type options:
    d: 'dos',
    m: 'mixed',
    M: 'mode',
    u: 'unix',
    w: 'windows',
    t: 'type',
    // Path conversion options:
    a: 'absolute',
    l: 'long-name',
    p: 'path',
    U: 'proc-cygdrive',
    s: 'short-name',
    C: 'codepage',
    // System information:
    A: 'allusers',
    D: 'desktop',
    H: 'homeroot',
    O: 'mydocs',
    P: 'smprograms',
    S: 'sysdir',
    W: 'windir',
    F: 'folder',
    // Other options:
    f: 'file',
    o: 'option',
    c: 'close',
    i: 'ignore',
    h: 'help',
    V: 'version',
};

function cygpath(name, options) {
    const args = [];
    Object.keys(options || {})
        .forEach((key) => {
            if (options[key]) {
                args.push('--' + key);
                if (options[key].constructor === String) {
                    args.push(options[key]);
                }
            }
        });
    if (name) {
        args.push('--', name);
    }
    debug('cygpath', args.join(' '));
    const converted = childProcess
          .execFileSync('cygpath', args, {encoding: 'utf8'})
          .replace(/(?:\r\n|\r|\n)$/, '');
    debug('converted:', converted);
    return converted;
}

module.exports = function (name, options, relative) {
    if (name && !/[/\\]|^(?:[.]{1,2}|[a-z]:)$/i.test(name)) { // not a kind of path
        return name;
    }
    // normalize options
    options = options || {};
    if ({}.hasOwnProperty.call(options, 'relative')) {
        console.warn('Deprecated: Use 3rd argument instead');
        relative = options.relative;
        delete options.relative;
    }
    Object.keys(options).forEach((option) => {
        const longOption = OPTION_MAP[option];
        if (longOption) {
            if ({}.hasOwnProperty.call(options, longOption)) {
                throw new Error('Conflict short option and long one');
            }
            options[longOption] = options[option];
            delete options[option];
        }
    });
    ['codepage', 'folder'].forEach((key) => {
        if (options[key] && options[key].constructor === Number) {
            options[key] = String(options[key]);
        }
    });
    if (['dos', 'mixed', 'mode', 'unix', 'windows', 'type'].filter((type) => Boolean(options[type])).length === 0) {
        options.type = 'unix';
    }

    // determin operation parameters for relative
    let native = null;
    if (relative) {
        if (options.absolute) {
            throw new Error('Conflict option relative and absolute');
        }
        if (relative.constructor !== String) {
            relative = process.cwd();
        }
        native = (options.unix || options.type === 'unix') ? path.posix : path.win32;
    }

    // execute
    let converted = cygpath(name, options);

    // relative
    if (relative && native.isAbsolute(converted)) {
        // fixup from
        const opts = Object.assign({}, options, {absolute: true});
        'ADHOPSWFfocihV'.split('').forEach((key) => delete opts[OPTION_MAP[key]]);
        relative = cygpath(relative, opts);
        // convert to relative
        converted = ['.', native.relative(relative, converted)].join(native.sep);
        if (options.mixed || options.type === 'mixed') {
            converted = converted.split(native.sep).join(path.posix.sep);
        }
    }

    return converted;
};

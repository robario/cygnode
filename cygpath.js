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
    if (2 <= ['dos', 'mixed', 'mode', 'unix', 'windows', 'type'].filter((key) => Boolean(options[key])).length) {
        throw new Error('invalid type: ' + JSON.stringify(options));
    }
    ['dos', 'mixed', 'unix', 'windows'].forEach((type) => {
        if (options[type]) {
            delete options[type];
            options.type = type;
        }
    });
    if (!options.type) {
        options.type = 'unix';
    }
    let joinSep = null;
    switch (options.type) {
    case 'dos':
        options.short = true;
        joinSep = path.win32.sep;
        break;
    case 'mixed':
        joinSep = path.posix.sep;
        break;
    case 'unix':
        joinSep = path.posix.sep;
        break;
    case 'windows':
        joinSep = path.win32.sep;
        break;
    default:
        throw new Error('invalid type: ' + JSON.stringify(options));
    }

    if (relative) {
        if (relative.constructor !== String) {
            relative = process.cwd();
        }
        options.absolute = true;
    }

    let converted = cygpath(name, options);

    if (relative) {
        relative = cygpath(relative, {
            type: options.type,
            absolute: true,
        });
        if (options.type === 'unix') {
            converted = path.posix.relative(relative, converted);
        } else {
            converted = path.win32.relative(relative, converted)
                .split(path.win32.sep)
                .join(joinSep);
        }
        converted = ['.', converted].join(joinSep);
    }

    return converted;
};

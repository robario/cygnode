'use strict';
// core
const childProcess = require('child_process');
const path = require('path');
// local
const debug = require('./debug.js');

function cygpath(name, options) {
    const args = [];
    Object.keys(options || {})
        .forEach((key) => {
            if (options[key]) {
                args.push((1 < key.length ? '--' : '-') + key);
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
    if (2 <= ['dos', 'd', 'unix', 'u', 'windows', 'w', 'type', 't'].filter((key) => Boolean(options[key])).length) {
        throw new Error('invalid type: ' + JSON.stringify(options));
    }
    if (options.t) {
        options.type = options.t;
        delete options.t;
    }
    ['dos', 'mixed', 'unix', 'windows'].forEach((type) => {
        if (options.type === type || options[type] || options[type.charAt(0)]) {
            delete options[type];
            delete options[type.charAt(0)];
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

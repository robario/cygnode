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
            args.push((1 < key.length ? '--' : '-') + key);
            if (options[key] && options[key].constructor === String) {
                args.push(options[key]);
            }
        });
    args.push('--', name);
    debug('cygpath', args.join(' '));
    const converted = childProcess
          .execFileSync('cygpath', args, {encoding: 'utf8'})
          .replace(/(?:\r\n|\r|\n)$/, '');
    debug('converted:', converted);
    return converted;
}

module.exports = function (name, options) {
    options = options || {};
    let from = null;
    if (options.relative) {
        from = options.relative === true ? process.cwd() : options.relative;
        delete options.relative;
        options.absolute = true;
    }

    // normalize options
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

    let retval = cygpath(name, options);

    if (from) {
        from = cygpath(from, {
            type: options.type,
            absolute: true,
        });
        if (options.type === 'unix') {
            retval = path.posix.relative(from, retval);
        } else {
            retval = path.win32.relative(from, retval)
                .split(path.win32.sep)
                .join(joinSep);
        }
        retval = ['.', retval].join(joinSep);
    }

    return retval;
};

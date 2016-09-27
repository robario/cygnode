'use strict';

var name = 'cygnode'.toUpperCase();
var debug = null;
if (typeof process === 'object' &&
    typeof process.env === 'object' &&
    new RegExp('\\b' + name + '\\b', 'i').test(process.env.NODE_DEBUG)) {
    debug = function () {
        console.log.apply(console, [name].concat(Array.prototype.slice.call(arguments)));
    };
} else {
    debug = function () {
        // do nothing.
    };
}

module.exports = debug;

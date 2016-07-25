'use strict';

process.argv[0] = process.execPath = process.execPath.replace(/\bnodeImpl[.]exe$/, 'node');

const isCygwin = process.platform === 'win32' && (process.env.ORIGINAL_PATH || '').indexOf('/cygdrive/') !== -1;
if (!isCygwin) {
    throw new Error('Cygwin Only');
}

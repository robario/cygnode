#! /bin/sh
#
# @(#) uninstall.sh
#
set -o errexit
set -o noclobber
set -o nounset

source "$(dirname "$0")/variables.sh"

rm "$confPath"
if test -e "$nodePath"
then
    mv --force "$nodePath" "$execPath"
else
    rm "$nodejsPath"/node-v*.exe
fi

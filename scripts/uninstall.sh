#! /bin/sh
#
# @(#) uninstall.sh
#
set -o errexit
set -o noclobber
set -o nounset

source "$(dirname "$0")/variables.sh"

rm "$execPath" "$confPath"
mv "$nodePath" "$execPath"

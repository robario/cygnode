#! /bin/sh
#
# @(#) install.sh
#
set -o errexit
set -o noclobber
set -o nounset

source "$(dirname "$0")/variables.sh"

mv "$execPath" "$nodePath"
cp "$cygnodePath/node.exe" "$execPath"
{
    echo "$nodePath"
    echo "$cygnodePath"
} 1>|"$confPath"

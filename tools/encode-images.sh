#!/bin/bash

srcdir=$1
destdir=$2

for file in ${srcdir}/*.png
do
  filepathbase=${file##*/}
  filenamebase="${filepathbase%.*}"
  b64path="${destdir}/${filenamebase}.b64"
  base64 -w 0 "${file}" | cat <(echo -n "data:image/png;base64,") - > "${b64path}"
done

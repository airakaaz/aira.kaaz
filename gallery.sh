#!/usr/bin/env bash

find gallery -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) |
    sort |
    sed 's#gallery/##' |
    jq -R . |
    jq -s . >gallery/gallery.json

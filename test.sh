#!/bin/bash
input="./urls.txt"
while IFS= read -r line
do
  echo "$line"
  OUT=$(echo "$line"| tr '/:.' '_')
  echo "$OUT"
  node qalpl.js https://$line 1 1 $OUT.txt
done < "$input"
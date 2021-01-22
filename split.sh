#!/usr/bin/env bash
INPUT_FILE=${1:-'urls.txt'}
NUMBER_OF_FILES=${2:-4}
SUFFIX=${3:-'_splitted_'}
TOTAL_LINES=$(cat $INPUT_FILE | wc -l )
LINE_PER_FILE=$(($TOTAL_LINES / $NUMBER_OF_FILES))

echo "$0 lancé pour $INPUT_FILE qui a $TOTAL_LINES lignes."
echo "Découpage en $NUMBER_OF_FILES fichiers de $LINE_PER_FILE lignes."
echo "Fichier de sortie : ${INPUT_FILE%.*}${SUFFIX}xx.${INPUT_FILE##*.}"

rm *$SUFFIX*
split \
    --lines=$LINE_PER_FILE \
    --numeric-suffixes \
    --additional-suffix=".${INPUT_FILE##*.}" \
    $INPUT_FILE ${INPUT_FILE%.*}${SUFFIX}

echo && ls -al *$SUFFIX*

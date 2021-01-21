#!/bin/bash

set -e -x

#rm ./data/__out/* -rf
rm ./urls.txt -f

date
start=`date +%s`

#node qalpl.js https://www.epfl.ch/en 1 1 out_epfl.json
#node qalpl.js https://www.epfl.ch/fr 1 1 out_epfl_fr.json
#node qalpl.js https://www.epfl.ch/labs/fr 2 5 out_epfl_labs_fr.json
#node qalpl.js https://www.epfl.ch/labs/ 2 1 out_epfl_labs_en.json
#node qalpl.js https://www.epfl.ch/campus/associations/list 2 1 out_epfl_associations_en.json
#node qalpl.js https://www.epfl.ch/campus/associations/list/fr 2 1 out_epfl_associations_fr.json

#end=`date +%s`
#runtime=$((end-start))

cat ./data/__out/*.txt | sort -n | uniq > ./urls.txt
cat urls.txt | wc -l

time npm start -- --file './urls.txt' --performance --report --useragent FSD

endlast=`date +%s`
runtime=$((endlast-start))

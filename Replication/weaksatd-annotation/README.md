# WeakSATD annotation

## Repositories
The script needs access to the repositories of Chromium, Linux Kernel, and Mozilla Firefox, which can be downloaded with the following commands.
```
mkdir chromiumMining & cd chromiumMining
git clone git@github.com:chromium/chromium.git
git checkout 57f97b2
cd ..
mkdir firefoxMining & cd firefoxMining
hg clone https://hg.mozilla.org
hg update -r 4d46db3ff28b
cd ..
mkdir linuxMining & cd linuxMining
git clone https://github.com/torvalds/linux
git checkout e2ca6ba
```
It is recommended to exclude the folders `chromiumMining, linuxMining, and firefoxMining` from the indexing of the IDE to maintain the usability of such.

## Extraction of functions
With the following command, the functions of the three large open-source projects are extracted. It extracts single functions into individual files.
```
npm run mineProjects <chrome|linux|firefox>
```
## Merging single files to a CSV
The single function are taken from the previous step and merged into a single CSV which contains the code, projectname, and filepath. The remaining columns are as well created but not yet filled.
```
python mergeFiles
```
## Annotate with WeakSATD
The CSV file from the previous step is loaded and the code is evaluated against the tool WeakSATD. The first parameter is the filename. Followed by the chunk which is evaluated and the total number of chunks, so that the time-consuming task can be parallelized. If set to `1 1` the entir dataset is labelled at the same time. 
The script needs to be executed X-times which reflects the total number of chunks selected. It is recommened to split the annotation into multipls steps, else the program suffers from memory issues. We observed that the best size of each chunk should be less than 10,000.
```
npm run annotateForVulnerabilities complete.csv 1 10
```

## Annotate for SATD
Lastly the missing columns (SATD, HasComments, Comments, CommitID, FunctionWithoutComments, and Class) are filled up. 
```
python annotateForSATD.py --input-path . --output-path .
```

### Note
`Function` is not a column in this part of the dataset since it is intented to refer to the original column of a dataset. Which is part of the replication package not the case as a dataset is newly created rather than extended.
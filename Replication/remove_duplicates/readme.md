# Removal of duplicates 

With this folder it is possible to remove duplicate files.

Firstly, the [jupyter notebook](extract_functions_into_single_files.ipynb) of creating a set of individual files needs to be executed.

Followed by the creation of the pmd-cpd reports, which can be executed with the following command 

```
pmd cpd --dir <folder> 
    --minimum-tokens 30 
    --language cpp 
    --format csv 
    --skip-lexical-errors true 
    --no-fail-on-violation 
    --ignore-literal-sequences 
    --ignore-sequences > <outputpath/*.csv>
```

Lastly, the [jupyter notebook](extract_files_code_duplication_overlapping.ipynb) can be executed to extract the information about the duplicate files.
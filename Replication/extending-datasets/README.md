# Extending of a dataset

### Repositories 

To extract the leading comments, the script needs access to the project repositories. Except for the Android project, this access is provided by locally cloning the projects. The script expects the repositories to be in the folder data/repositories. To facilitate the process, the folder name should be equal to the project labels used in the original datasets. This can be done using the following commands:

```
cd data/repositories
git clone https://github.com/php/php-src.git
git clone https://github.com/FFmpeg/FFmpeg.git
git clone https://github.com/qemu/qemu.git
git clone https://github.com/torvalds/linux.git
git clone https://github.com/ImageMagick/ImageMagick.git
git clone https://github.com/the-tcpdump-group/tcpdump.git
git clone https://github.com/radareorg/radare2.git
git clone https://github.com/krb5/krb5.git
git clone https://github.com/file/file.git
git clone https://github.com/chromium/chromium.git Chrome
```

Some of the entries for the PHP interpreter are labelled as php, to handle this issue, it is possible to create a sym link to the project folder (instead of making a new clone on a different directory) as follows:

```
ln -s php-src php
```

### Original Datasets

We recommend saving the original datasets into the data directory.

```
cd ..
```

Devign should be downloaded from the original files provided the authors [here](https://sites.google.com/view/devign) and saved into the data directory. To do that, you can simply do this: 

```
gdown https://drive.google.com/uc?id=1x6hoF7G-tSYxg8AFybggypLZgMGDNHfF -O devign.json
```

For convenience, we suggest downloading the Big-Vul as provided by Fu and Tantithamthavorn [here](https://github.com/awsm-research/LineVul). Then, we filter the columns and projects used.

```
gdown https://drive.google.com/uc?id=10-kjbsA806Zdk54Ax8J3WvLKGTzN8CMX -O big-vul.csv
cd ..
python filter_bigvul.py
```

### Adding the new columns

Now, it is time to create the MADE-WIC parts for Devign and Big-Vul:

```
python main.py -i data/devign.json -o devign_made-wic.csv
python main.py -i data/big-vul_filtered.csv -o big-vul_made-wic.csv
```


### Troubleshoot

We have experienced some issues with the bindings of srcML for Python (PyLibSrcML) with errors such:

```
AttributeError: python: undefined symbol: srcml_version_number
```

The reason for this issue is that the srcML library is not found by the Python bindings. You should check with the correct path is included in the options listed in the file globals.py inside the folder pylibsrcml inside the site-packages folder of the virtual environment. In our case, we added (the path will vary depending on where srcML is installed in your system): 

```
    elif os.path.exists("/usr/local/lib/libsrcml.so") :
        LIBSRCML_PATH = "/usr/local/lib/libsrcml.so"
```
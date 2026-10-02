# VulSATDData replication package

This repository contains the code to recreate the dataset presented in the paper "MADE-MIC: Multiple Annotated Datasets for Exploring Weaknesses In Code".

## Overview of the approach

![image](made-wic-approach.png)

## Creation of a new Dataset from large scale open source projects

### Requirements

We build the dataset using Node 18.6.0 and srcml must also be installed. Given the size of the repositories, at least 100GB of free disk space are needed.

We recommend the usage of [NVM](https://github.com/nvm-sh/nvm) to manage the installed node version on the machine.

## How to build

The first step is to download the repository locally.

Installation of the dependancies:
```
cd weaksatd-annotation
npm ci
```

## How to generate and annotate the dataset 

And then follow the instructions for [creationg and labelling using WeakSATD](weaksatd-annotation/README.md).


## Extention of existing datasets (Devign and Big-Vul)

### Requirements

We built the dataset using Python 3.10 and srcML must also be installed. Given the size of the repositories, at least 100GB of free disk space are needed.

### How to build the dataset

The first step is to download the repository locally.

We recommend the creation of a virtual environment, for example, using venv (the exact commands might need to be adapted according to your system):

```
python3 -m venv env
source env/bin/activate
```

Then, install the dependencies which are listed in the requirements.txt file. This can be done using `pip`:

```
pip install -r extending-datasets/requirements.txt
```

### How to annotate and extend existing datasets

And then follow the instructions for [extending the dataset](extending-datasets/README.md) or the [annotation with WeakSATD](weaksatd-annotation/README.md).

### Adjusting the dataset

In the folder [augment-data](augment-data/readme.md) we provide a set of functions which can be used to further augment the data by combining or removing data from the current state of the dataset.
import re
import os
import pandas as pd
from tqdm import tqdm

def load_data(path, nrows=None):
    df = pd.concat([chunk for chunk in tqdm(pd.read_csv(path, chunksize=1000, lineterminator="\n", nrows=nrows), desc="Load csv...")])
    return df


def get_mat():
    return ["xxx", "todo", "hack", "fixme"]


# replicated from https://github.com/Naplues/MAT/blob/master/src/main/methods/Mat.java
def has_task_words(x, patterns=get_mat(), index=0):
    regex = re.compile('[^a-zA-Z\s]')
    regex_space = re.compile('[\s]')

    x_mod = regex.sub("", x)  # replaces non-alpha characters
    x_mod = regex_space.sub(" ", x_mod)  # converts tab and other space characters into a single space

    words = x_mod \
        .lower() \
        .replace("'", "") \
        .split(' ')

    words = [word for word in words if 20 > len(word) > 2]  # removes words which are too short or too long

    for word in words:
        for key in patterns:
            if word.startswith(key) or word.endswith(key):
                if 'xxx' in word and word != 'xxx':
                    return False
                else:
                    return True
    return False

def get_comment_regex(pl):
    comment_regex = None
    pl = pl.lower()
    if pl == "c":
        comment_regex = re.compile('((\/\*([\s\S]*?)\*\/)|((?<!:)\/\/.*))', re.MULTILINE)
    else:
        print("Programming language is not covered... Exiting...")
        quit()

    return comment_regex

def hasLicense(comment):
    license_regex = re.compile(".*(license|copyright|all rights reserved)", re.IGNORECASE)
    if len(license_regex.findall(comment)) > 0:
        return True

    return False

def extract_comment(pl, code, array=False):
    comment_regex = get_comment_regex(pl)

    detected_comments = re.findall(comment_regex, code)
    comments = [comment[0] for comment in detected_comments if not hasLicense(comment[0])]

    if array:
        return comments

    return ' '.join(comments)

def save_data(base_path, filename, data):
    for index in range(len(base_path.split("/"))):
        p = "/".join(base_path.split("/")[0:index + 1])
        if not os.path.isdir(p):
            os.mkdir(p)

    data.to_csv("{}/{}.csv".format(base_path, filename), index=False)
    print("{} was stored!".format("{}/{}.csv".format(base_path, filename)))
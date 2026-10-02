import pandas as pd
from tqdm import tqdm
import math, re


def load_data(path, nrows=None):
    df = pd.concat(
        [chunk for chunk in
         tqdm(pd.read_csv(path, chunksize=1000, lineterminator="\n", nrows=nrows), desc="Load csv...")])
    return df


def merge_f_lc(row):
    if isinstance(row["LeadingComment"], float) and math.isnan(row["LeadingComment"]):
        return row["Function"]

    return "\n".join([row["LeadingComment"],row["Function"]])


def merge_function_with_leading_comment(data, key = "FunctionWithLeadingComment"):
    tqdm.pandas(total=len(data), desc="Merging Function and Leading Comment...")
    data[key] = data.progress_apply(merge_f_lc, axis=1)

    return data


def get_comment_regex(pl):
    comment_regex = None
    pl = pl.lower()
    if pl == "go" or pl == "java" or pl == "javascript" or pl == "c":
        comment_regex = re.compile('((\/\*([\s\S]*?)\*\/)|((?<!:)\/\/.*))', re.MULTILINE)
    elif pl == "php":
        comment_regex = re.compile('(((\/\*([\s\S]*?)\*\/)|((?<!:)\/\/.*))|(#.+?(?=\?\>))|(#.*))', re.MULTILINE)
    elif pl == "ruby":
        comment_regex = re.compile('((#.*)|(\=begin[\s\S]*?\=end))', re.MULTILINE)
    elif pl == "python":
        comment_regex = re.compile('((#.*)|(\'|"){3}[\s\S]*?(\'|"){3})', re.MULTILINE)
    else:
        print("Programming language is not covered... Exiting...")
        quit()

    return comment_regex


def extract_comment(row, pl="c", array=False):
    comment_regex = get_comment_regex(pl)
    result = []
    code = merge_f_lc(row)
    detected_comments = re.findall(comment_regex, code)
    comments = ' '.join([comment[0] for comment in detected_comments])
    result.append(comments)

    if array == True:
        return result
    
    return " ".join(result)
    

def extract_comments(data, key= "OnlyComments"):
    tqdm.pandas(total=len(data), desc="Extracting comments...")
    data[key] = data.progress_apply(extract_comment, axis=1)

    return data

def has_comment(row):
    comments = extract_comment(row)

    if comments == "":
        return 0

    return 1

def has_comments(data, key = "hasComment"):
    tqdm.pandas(total=len(data), desc="Extracting if a function contains a comment...")
    data[key] = data.progress_apply(has_comment, axis=1)

    return data
    

def remove_comment(row):
    comments = extract_comment(row, pl="c", array=True)
    code = row["Function"]
    
    for comment in comments:
        code = code.replace(comment, "")

    return code
    

def remove_comments(data, key = "OnlyFunction"):
    tqdm.pandas(total=len(data), desc="Removing comments from function...")
    data[key] = data.progress_apply(remove_comment, axis=1)

    return data
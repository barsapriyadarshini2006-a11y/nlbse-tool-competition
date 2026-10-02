from tqdm import tqdm
from argparse import ArgumentParser
from utils import load_data, has_task_words, extract_comment, save_data

FILENAMES = ["complete"]

# --input-path ./cfl --output-path ../data --output-path-labelled ../data-labelled/cfl

def read_args():
    parser = ArgumentParser()

    parser.add_argument("--input-path", type=str, required=True)
    parser.add_argument("--output-path", type=str, required=True)

    return parser.parse_args()

def addKey(data, newKey):
    if newKey in data:
        return data

    data[newKey] = ""
    return data

COMMIT_IDS = {
    "chrome": "57f97b2",
    "firefox": "4d46db3ff28b",
    "kernel": "e2ca6ba"
}

PROJECT_NAMES = {
    "chrome": "Chromium",
    "firefox": "Mozilla Firefox",
    "kernel": "Linux Kernel"
}

import re
def clean_head(code):
    code = code.split("\n")
    count = 0
    for line in code:
        if is_empty_string(line):
            count = count + 1
        else:
            break
    return "\n".join(code[count:])

def is_empty_string(s):
    return re.sub(r'\s+', '', s) == ''

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
def extract_comments_from_code(code, pl="c"):
    comment_regex = get_comment_regex(pl)
    detected_comments = re.findall(comment_regex, code)
    return [comment[0] for comment in detected_comments]

def extracting_leading_comment(code):
    #print(code)
    comments = extract_comments_from_code(code)
    leading_comments = []
    if len(comments) > 0:
        for comment in comments:
            code = clean_head(code)
            head_old = code.split("\n")[0]
            code = code.replace(comment, "")
            head_new = code.split("\n")[0]
            code = clean_head(code)
            count = 0
            #print("old {}".format(head_old))
            #print("new {}".format(head_new))
            if(head_old != head_new):
                leading_comments.append(comment)
            else:
                # comment was not a leading comment, and since the comments are ordered based on their occurance
                # in the function the following comments are as well not leading comments
                break


    return " ".join(leading_comments)

def remove_leadingcomment(code):
    comments = extract_comments_from_code(code)
    if len(comments) > 0:
        for comment in comments:
            code = clean_head(code)
            head_old = code.split("\n")[0]
            code = code.replace(comment, "")
            head_new = code.split("\n")[0]
            code = clean_head(code)
            count = 0
            #print("old {}".format(head_old))
            #print("new {}".format(head_new))
            if(head_old == head_new):
                # comment was not a leading comment, and since the comments are ordered based on their occurance
                # in the function the following comments are as well not leading comments
                break

    return code

if __name__ == "__main__":
    args = read_args()
    print(args)
    
    for filename in FILENAMES:
        path_input = "{}/{}.csv".format(args.input_path, filename)
        data = load_data(path_input, nrows=10)

        data = addKey(data, "Commit-ID")
        data = addKey(data, "MAT")
        data = addKey(data, "PS")
        data = addKey(data, "SecI")
        data = addKey(data, "Function")
        data = addKey(data, "LeadingComment")


        pbar = tqdm(total=len(data))
        for index in range(len(data)):
            pbar.update(1)
            code_with_leading_comment = data["FunctionWithComments"][data.index[index]]
            leading_comment = extracting_leading_comment(code_with_leading_comment)
            code = remove_leadingcomment(code_with_leading_comment)
            comments = extract_comment("c", code, array=True)
            data.loc[index, "MAT"] = 1 if len([comment for comment in comments if has_task_words(comment)]) > 0 else 0
            data.loc[index, "PS"] = 1 if len([comment for comment in comments if has_task_words(comment)]) > 0 else 0
            data.loc[index, "SecI"] = 1 if len([comment for comment in comments if has_task_words(comment)]) > 0 else 0
            data.loc[index, "Commit-ID"] = COMMIT_IDS[data["Project"][data.index[index]]]
            data.loc[index, "Function"] = code
            data.loc[index, "LeadingComment"] = leading_comment

        data = data.drop(columns=['FunctionWithComments', 'Comments', 'FunctionWithoutComments', 'Class', 'HasComment', 'SATD'])
        data = data.rename(columns={'Project': 'Projectname', 'CommitID': 'Commit-ID', 'Filename': 'Filepath'})

        save_data("{}".format(args.output_path), filename, data)

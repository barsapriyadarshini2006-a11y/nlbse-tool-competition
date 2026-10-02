import re
from srcml_helper import SrcMLHelper

srcml_helper = SrcMLHelper()
comment_regex = re.compile('((\/\*([\s\S]*?)\*\/)|((?<!:)\/\/.*))', re.MULTILINE)

def extract_comments_srcml(code):
    comments_list = srcml_helper.extract_comments(srcml_helper.get_srcml_tree_for(code))
    return ' '.join(comments_list) if any(comments_list) else ''

comment_regex = re.compile('((\/\*([\s\S]*?)\*\/)|((?<!:)\/\/.*))', re.MULTILINE)
def extract_comments_regex(code):
    comments_list = comment_regex.findall(code)
    return ' '.join([comment[0] for comment in comments_list])

def remove_comments(code):
    return comment_regex.sub(' ', code).strip()
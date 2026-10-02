import json
import pandas as pd
import re
from tqdm import tqdm
tqdm.pandas()
from argparse import ArgumentParser

from repositories_helper import RepositoriesHelper
from srcml_helper import SrcMLHelper
from repo_searcher import RepoSearcher

def load_original_dataset(dataset_file):
    if 'json' in dataset_file:
        original_dataset_file = open(dataset_file)
        data_json = json.load(original_dataset_file)
        print('Original dataset keys: {}'.format(data_json[0].keys()))
        data = pd.DataFrame.from_dict(data_json)
    else:
        data = pd.read_csv(dataset_file)
    dataset = 'bigvul' if 'processed_func' in data.columns else 'devign'

    print('Detected dataset: {}'.format(dataset))
    if dataset == 'bigvul':
        data = data.rename(columns = { 'processed_func': 'Function', 'target': 'Big-Vul', 'commit_id': 'Commit-ID', 'file_name': 'Filename', 'project': 'Projectname' })
    elif dataset  == 'devign':
        data = data.rename(columns = { 'func': 'Function', 'target': 'Devign', 'commit_id': 'Commit-ID', 'project': 'Projectname' })
        data['Filename'] = None
        data['codeLink'] = None
    return data


def str2bool(v):
    parser = ArgumentParser()
    if isinstance(v, bool):
        return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise parser.error('Boolean value expected.')

satd_functions = 0
dataset_satd_functions = 0
failed_functions = 0
failed_to_get_commit = 0
inconsistencies = 0
augmented_functions = 0
failed_read_function_excerpt = 0
entry_id = 0

srcml_helper = SrcMLHelper()

def is_code_not_contained_on(function_code_on_dataset, function_code_with_comments):
    return re.sub(r'\W+', '', function_code_on_dataset) not in re.sub(r'\W+', '', function_code_with_comments)

def create_new_columns(original_code, filename, project, commit_id, codelink):
    
    global entry_id, satd_functions, dataset_satd_functions, failed_functions, failed_to_get_commit, inconsistencies, augmented_functions, failed_read_function_excerpt
    entry_id = entry_id + 1
    
    function_code_with_comments = None
    language = 'C' if filename is not None and isinstance(filename, str) and filename.endswith('.c') else 'C++'
    original_code_tree = srcml_helper.get_srcml_tree_for(original_code, language)
    function_name = srcml_helper.get_function_name(original_code_tree)
    
    if args.debug:
        print(function_name)

    original_code_has_satd = srcml_helper.has_satd(original_code_tree)

    final_code = original_code
    final_code_tree = original_code_tree
    final_code_has_mat = False
    final_code_has_ps = False
    final_code_has_secI = False

    leading_comment = None
    changed_file_name = None

    if function_name is not None:
        code_with_comments_srcml = None

        try:
            code_with_comments_srcml, augmented, leading_comment_srcml, changed_file_name = repo_searcher.search_function_on_original_code(entry_id, 
                                                                                        function_name, 
                                                                                        project, 
                                                                                        commit_id, 
                                                                                        filename,
                                                                                        codelink) if function_name is not None else None
            if code_with_comments_srcml is not None:
                function_code_with_comments = srcml_helper.get_code_for(code_with_comments_srcml)
                if function_code_with_comments is None or is_code_not_contained_on(original_code, function_code_with_comments):
                    inconsistencies = inconsistencies + 1
                    print('WARN: inconsistent code. Keeping the original code.')
                elif augmented:
                    # print(function_code_on_dataset)
                    # print('----')
                    leading_comment = srcml_helper.get_code_for(leading_comment_srcml)
                    final_code = '\n'.join([leading_comment, original_code])
                    # print(function_code_final)
                    # print('------------')
                    final_code_tree = srcml_helper.get_srcml_tree_for(code_with_comments_srcml, language)
                    comments = srcml_helper.extract_comments(final_code_tree)
                    final_code_has_mat = mat.predict(comments)
                    final_code_has_ps = ps.predict(comments)
                    final_code_has_secI = secI.predict(comments)
                    augmented_functions = augmented_functions + 1
            else:
                failed_functions = failed_functions + 1
                print('WARN: function not found in the commit. Keeping the original code.')
        except ValueError as e:
            print('ERROR: could not find commit: {}'.format(commit_id))
            failed_to_get_commit = failed_to_get_commit + 1
    else:
        print('ERROR: failed to get function name for original excerpt.')
        failed_read_function_excerpt = failed_read_function_excerpt + 1

    if original_code_has_satd:
        dataset_satd_functions = dataset_satd_functions + 1
    if final_code_has_mat:
        satd_functions = satd_functions + 1

    return original_code, leading_comment, changed_file_name 

def create_new_columns_on_row(row):
    return create_new_columns(row.Function, row.Filename, row.Projectname, row["Commit-ID"], row.codeLink)

if __name__ == "__main__":

    parser = ArgumentParser()
    parser.add_argument('-i', '--input', type=str, required=True)
    parser.add_argument('-o', '--output', type=str, required=True)
    parser.add_argument('--save-files', type=str2bool, default=False)
    parser.add_argument('--debug', type=str2bool, default=False)

    args = parser.parse_args()

    print('Loading ', args.input)
    data = load_original_dataset(args.input)
    data = data[0:10]
    print('Number of entries: {}'.format(len(data)))

    repos_helper = RepositoriesHelper(['FFmpeg', 'qemu', 'ImageMagick', 'php-src', 'php', 'tcpdump', 'radare2', 'krb5', 'linux', 'file', 'Chrome'])
    repo_searcher = RepoSearcher(repos_helper, args.debug, args.save_files)

    data[['Function', 'LeadingComment', 'Filepath']] = data.progress_apply(create_new_columns_on_row, axis=1, result_type="expand") 

    if 'xlsx' in args.output:
        data.to_excel(args.output, index=False)
    else:
        data.to_csv(args.output, index=False)

    print('Number of entries: {}'.format(len(data)))
    print('Total number of functions with SATD: {}'.format(satd_functions))
    print('Total number of functions with SATD on original dataset: {}'.format(dataset_satd_functions))
    print('Number of augmented functions: {}'.format(augmented_functions))
    print('Failed to read excerpt function name: {}'.format(failed_read_function_excerpt))
    print('Failed to parse functions: {}'.format(failed_functions))
    print('Failed to find commit: {}'.format(failed_to_get_commit))
    print('Inconsistencies: {}'.format(inconsistencies))



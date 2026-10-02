import os
from io import BytesIO
import charset_normalizer
import requests
import base64

from srcml_helper import SrcMLHelper

def save_file_in_dir(path, content):
    directory = os.path.dirname(path)
    if not os.path.exists(directory):
        os.makedirs(directory)
    with open(path, 'w') as o:
        o.write(content)

class RepoSearcher:

    def __init__(self, repos_helper, debug, should_save_files):
        self.debug = debug
        self.should_save_files = should_save_files
        self.srcml_helper = SrcMLHelper() 
        self.repos_helper = repos_helper   
        
    def try_to_get_function_with_comments(self, changed_file_content, function_name, language='C++'):
        changed_file_function = self.srcml_helper.get_function(function_name, changed_file_content, language)

        if changed_file_function is not None:
            return self.srcml_helper.get_srcml_func_with_comments(changed_file_function)
        return None, False, None

    def search_function_on_original_code(self, line_id, function_name, project, commit_id, filename, codelink):
        if project == 'Android':
            return self.search_function_on_android(line_id, function_name, filename, codelink)
        else:
            return self.search_function_on_local_repo(line_id, function_name, project, commit_id, filename)

    def search_function_on_local_repo(self, line_id, function_name, project, commit_id, filename):
        augmented = False
        changed_file_function_srcml = None
        leading_comment_srcml = None
        for changed_file_name, changed_file in self.repos_helper.get_files_changed(project, commit_id):

            if filename is not None and isinstance(filename, str) and changed_file_name != filename:
                continue

            if self.debug:
                print('Inspecting: {}'.format(changed_file_name))

            try:
                with BytesIO(changed_file.data_stream.read()) as changed_file_stream:
                    changed_file_content = str(charset_normalizer.from_bytes(changed_file_stream.read()).best())

                    language = 'C' if filename is not None and isinstance(filename, str) and filename.endswith('.c') else 'C++'
                    changed_file_function_srcml, augmented, leading_comment_srcml = self.try_to_get_function_with_comments(changed_file_content, function_name, language)

                    if changed_file_function_srcml is not None:
                        if self.should_save_files:
                            save_file_in_dir('original_files/{}/{}'.format(line_id, changed_file_name), changed_file_content)
                    break
            except Exception as e:
                print('ERROR: Failed processing file: {}'.format(changed_file_name))
                print(e)

        return changed_file_function_srcml, augmented, leading_comment_srcml, changed_file_name

    def search_function_on_android(self, line_id, function_name, filename, codelink):
        file_url = '{}/{}?format=TEXT'.format(codelink, filename)
        if self.debug:
            print(file_url)
        r = requests.get(file_url)
        #file_content = base64.b64decode(r.text).decode('utf-8')
        file_content = str(charset_normalizer.from_bytes(base64.b64decode(r.text)).best())

        language = 'C' if filename is not None and filename.endswith('.c') else 'C++'
        file_function_srcml, augmented, external_comment = self.try_to_get_function_with_comments(file_content, function_name, language)

        if file_function_srcml is not None:
            if self.should_save_files:
                save_file_in_dir('original_files/{}/{}'.format(line_id, filename), file_content)
        
        return file_function_srcml, augmented, external_comment, filename

    

from git import Repo

class RepositoriesHelper:

    def __init__(self, projects):
        self.repos = { project : Repo('data/repositories/' + project) for project in projects }

    def try_get_file(self, files, path):
        try:
            return files[path]
        except Exception:
            return None

    def get_files_changed(self, project: str, commit_id: str):

        if '?' in commit_id:
            commit_id = commit_id.split('?')[0] 
        if '#' in commit_id:
            commit_id = commit_id.split('#')[0]    
        repo = self.repos[project]
        commit = repo.commit(commit_id)

        parent_commit = commit.parents[0]

        return [ (file, self.try_get_file(parent_commit.tree, file)) for file in commit.stats.files]  
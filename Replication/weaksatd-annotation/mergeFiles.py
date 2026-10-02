import pandas as pd
import warnings
warnings.simplefilter(action='ignore', category=pd.errors.PerformanceWarning)
import os
from tqdm import tqdm

PROJECT_PATH = {
    "chrome":'chromiumMining/extractedFunctions',
    "firefox":'firefoxMining/extractedFunctions',
    "linux":'linuxMining/extractedFunctions'
}

PROJECT = [
    'chrome',
    'firefox',
    'linux'
]

PATH_DF = 'complete.csv'


def read_file(path):
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()
        return "".join(lines)


def load_csv(path, sep=','):
    if not os.path.isfile(path):
        print("Folder {} does not exists, please check if the steps before are executed properly!".format(path))
        print("Existing...")
        quit()

    df = pd.concat([chunk for chunk in tqdm(pd.read_csv(path, lineterminator="\n", chunksize=1000,  sep=sep), desc="Loading csv...")])
    return df

if __name__ == "__main__":
    df_data = pd.DataFrame()
    for project in PROJECT:
        print(PROJECT)
        print(project)
        print(PROJECT_PATH)
        path = PROJECT_PATH[project]
        df_filename = load_csv("{}/eval.csv".format(path), sep=';')
        df_data['FunctionWithComments'] = ''
        df_data['Comments'] = ''
        df_data['FunctionWithoutComments'] = ''
        df_data['Project'] = ''
        df_data['CommitID'] = ''
        df_data['Filename'] = ''
        df_data['SATD'] = ''
        df_data['WeakSATD'] = ''
        df_data['Class'] = ''
        df_data['HasComments'] = ''
        for index, row in df_filename.iterrows():
            code = read_file(df_filename["functionIndicator"][index])
            df_data.loc[index, 'Filename'] = '/'.join(df_filename["originalFileName"][index].split("\\")[2:])
            df_data.loc[index, 'Project'] = project
            df_data.loc[index, 'FunctionWithComments'] = code

    df_data.to_csv("complete.csv", index=False)

import pandas as pd
from tqdm import tqdm

projects = ['FFmpeg', 'ImageMagick', 'php-src', 'php', 'tcpdump', 'radare2', 'krb5', 'linux', 'file', 'Chrome', 'Android']

big_vul = pd.concat([chunk for chunk in tqdm(pd.read_csv('data/big-vul.csv', chunksize=1000), desc='Loading csv...')])

big_vul = big_vul[['codeLink', 'commit_id', 'file_name', 'project', 'target', 'processed_func']]

big_vul_filtered = big_vul[big_vul['project'].isin(projects)]
big_vul_filtered.to_csv('data/big-vul_filtered.csv')
print('Saved {} entries'.format(len(big_vul_filtered)))
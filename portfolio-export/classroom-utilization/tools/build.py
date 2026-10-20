from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
dist.mkdir(exist_ok=True)
for name in ['index.html', 'standalone.css', 'src']:
    source = root / name
    if source.is_dir(): shutil.copytree(source, dist / name, dirs_exist_ok=True)
    else: shutil.copy2(source, dist / name)
print('Static site built at', dist)

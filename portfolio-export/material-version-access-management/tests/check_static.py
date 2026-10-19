"""Dependency, isolation and source integrity checks. Python standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, hashlib, json, sys
base=Path(__file__).resolve().parents[1]
issues=[]
class Links(HTMLParser):
 def __init__(self,source): super().__init__(); self.source=source
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k not in ('src','href') or not v or v.startswith('#'): continue
   u=urlsplit(v)
   if u.scheme or v.startswith('//') or v.startswith('/'): issues.append(f'nonrelative runtime resource: {self.source}: {v}'); continue
   p=(self.source.parent/unquote(u.path)).resolve()
   if not p.is_relative_to(base) or not p.is_file(): issues.append(f'missing/escaping resource: {v}')
for f in base.rglob('*.html'): Links(f).feed(f.read_text(encoding='utf8'))
runtime=list((base/'assets').glob('*'))
for f in runtime:
 s=f.read_text(encoding='utf8')
 if re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(',s): issues.append(f'network code: {f.name}')
 if re.search(r'https?://|\b(?:sk-[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b',s): issues.append(f'URL or credential pattern: {f.name}')
 if '\ufffd' in s: issues.append(f'encoding replacement: {f.name}')
for f in base.rglob('*'):
 if f.is_file() and (f.name.startswith('.env') or f.suffix in ('.php','.mbz','.pem','.key','.sqlite')): issues.append(f'unwanted runtime file: {f.name}')
css=(base/'assets/compat.css').read_text(encoding='utf8')
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
for selector in re.findall(r'([^{}]+)\{',css):
 if selector.strip().startswith('@'): continue
 if not all(s.strip().startswith('#material-demo') for s in re.sub(r':where\([^)]*\)',':where',selector).split(',')): issues.append(f'unscoped CSS: {selector}')
if (base/'sources/manifest.json').exists():
 for row in json.loads((base/'sources/manifest.json').read_text(encoding='utf8')):
  if hashlib.sha256((base/'sources'/row['copy']).read_bytes()).hexdigest()!=row['sha256']: issues.append(f'source hash mismatch: {row["copy"]}')
  original=base.parents[1]/row['original']
  if original.exists() and hashlib.sha256(original.read_bytes()).hexdigest()!=row['sha256']: issues.append(f'checkout source changed: {row["original"]}')
if issues:
 print('\n'.join(issues));sys.exit(1)
print('PASS relative HTML resources, no network runtime / URL / credential patterns, scoped CSS, reference hashes')
print('Manual review still required for arbitrary secrets and visual/browser behavior.')

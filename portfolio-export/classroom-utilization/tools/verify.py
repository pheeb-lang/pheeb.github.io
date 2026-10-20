"""Audit exported source AND dist; no backend/database connections."""
from pathlib import Path
import re
import json
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1]
errors = []
class Resources(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src','href') and value:
                if not value.startswith('./') or not (current / value).is_file(): errors.append(f'missing/nonrelative resource: {value}')
for current in (root, root/'dist'):
    Resources().feed((current/'index.html').read_text(encoding='utf-8'))
    for path in [current/'index.html',current/'standalone.css',*sorted((current/'src').glob('*'))]:
        data=path.read_text(encoding='utf-8')
        for pattern in [r'https?://',r'\bfetch\s*\(',r'XMLHttpRequest|WebSocket|EventSource|sendBeacon',r'/api/',r'(?i)mysql|postgres|Bearer\s|PRIVATE KEY|AKIA[0-9A-Z]{16}',r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',r'A棟|大安|JPAIIST']:
            if re.search(pattern,data): errors.append(f'{path.relative_to(root)}: forbidden pattern {pattern}')
        if path.suffix=='.js':
            for target in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]", data):
                if not target.startswith('./') or not (path.parent/target).is_file(): errors.append(f'missing/nonlocal module {target}')
    css=(current/'src/styles.css').read_text(encoding='utf-8')
    for match in re.finditer(r'([^{}]+)\{',css):
        selectors=match.group(1).strip()
        if selectors.startswith('@media'): continue
        if any(not s.strip().startswith('#utilization-demo') for s in selectors.split(',')): errors.append('unscoped CSS selector: '+selectors)
for path in root.rglob('*'):
    if path.is_file() and (path.name.startswith('.env') or path.suffix in ('.pem','.key','.map')): errors.append('unwanted file: '+str(path))
assert not errors, '\n'.join(errors)
print('PASS: source and dist resource/module paths, scoped CSS, network and sensitive-pattern audit.')

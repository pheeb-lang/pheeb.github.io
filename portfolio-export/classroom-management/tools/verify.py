"""Dependency, resource, sensitive-pattern and CSS-scope checks (Python stdlib)."""
from pathlib import Path
from html.parser import HTMLParser
import re

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.paths = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for name in ['src', 'href']:
            if name in attrs: self.paths.append(attrs[name])

html = (ROOT/'index.html').read_text(encoding='utf-8')
page = Page(); page.feed(html)
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML IDs'
assert 'instructors-view' in page.ids and 'utilization-view' not in page.ids
assert 'connect-src \'none\'' in html
for path in page.paths:
    assert path.startswith('./'), path
    assert (ROOT/path).is_file(), path
for path in (ROOT/'src').glob('*.js'):
    content = path.read_text(encoding='utf-8')
    for dep in re.findall(r"from\s+['\"]([^'\"]+)['\"]", content):
        assert dep.startswith('./') and (path.parent/dep).is_file(), (path,dep)
    for id_ in re.findall(r"\$\('([^']+)'\)", content):
        assert id_ in page.ids, (path,id_)
    assert not re.search(r'\bfetch\s*\(|XMLHttpRequest|WebSocket|https?://|/api/|Bearer\s|-----BEGIN', content), path
for path in ROOT.rglob('*'):
    assert not path.name.startswith('.env'), path
css = (ROOT/'src/styles.css').read_text(encoding='utf-8')
for selector in re.findall(r'([^{}]+)\{', css):
    if selector.strip().startswith('@media'): continue
    assert all(s.strip().startswith('#classroom-demo') for s in selector.split(',')), selector
assert 'url(' not in css and '@import' not in css
assert not re.search(r'大安|JPAIIST|經濟部|陳怡安|林冠宇', html + ''.join(p.read_text(encoding='utf-8') for p in (ROOT/'src').glob('*')))
print(f'PASS: {len(page.ids)} unique IDs, HTML resources, JS imports/DOM IDs, relative paths, scoped CSS, no network code or source identity strings.')

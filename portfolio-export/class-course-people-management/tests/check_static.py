"""Offline checks and local HTTP subdirectory test. Does not test browser layout."""
from pathlib import Path
from html.parser import HTMLParser
import functools
import http.server
import re
import shutil
import tempfile
import threading
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        for key in ('src', 'href'):
            if key in data:
                self.refs.append(data[key])

def run():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    parser = Resources()
    parser.feed(html)
    assert 'connect-src \'none\'' in html
    assert '展示資料：所有操作僅影響本機模擬資料' in html
    for ref in parser.refs:
        assert not re.match(r'^(https?:|//|/)', ref), ref
        if not ref.startswith('#'):
            assert (ROOT / ref).is_file(), ref
    runtime = '\n'.join(p.read_text(encoding='utf-8') for p in (ROOT / 'assets').glob('*.js'))
    assert not re.search(r'\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|https?://|sessionStorage|document\.cookie|eval\s*\(|new Function', runtime)
    assert not re.search(r'\b(?:token|secret|api_key|authorization|sesskey)\s*[:=]', runtime, re.I)
    assert "replace(/[&<>\"']/g" in runtime
    assert not re.search(r'innerHTML\s*\+=|insertAdjacentHTML|document\.write', runtime)
    for p in ROOT.rglob('*'):
        if not p.is_file():
            continue
        assert p.suffix.lower() not in ('.php', '.env', '.pem', '.key', '.sqlite', '.db'), p
        text = p.read_text(encoding='utf-8-sig')
        assert '\ufffd' not in text, p
        if p.suffix in ('.js', '.csv', '.html', '.css'):
            assert '?' * 4 not in text, p
        if p.suffix in ('.js', '.csv', '.html', '.css'):
            for address in re.findall(r'[\w.+-]+@([\w.-]+\.[a-zA-Z]{2,})', text):
                assert address == 'example.com', (p, address)
    for p in (ROOT / 'assets').glob('*.css'):
        css = p.read_text(encoding='utf-8')
        assert not re.search(r'url\s*\(|@import|@font-face', css)
        assert css.count('{') == css.count('}')
        no_comments = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
        for match in re.finditer(r'(?:^|[{}])\s*([^{}]+)\{', no_comments):
            head = match[1].strip()
            if head.startswith('@'):
                continue
            # Commas inside :where(...) belong to one selector.
            for selector in re.split(r',\s*(?![^()]*\))', head):
                assert selector.strip().startswith('#classgroup-demo'), (p, selector)
    examples = ['programs', 'classes', 'offerings', 'students']
    for name in examples:
        assert (ROOT / 'examples' / (name + '.csv')).is_file()
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *_):
            pass
    with tempfile.TemporaryDirectory(prefix='classgroup-static-') as directory:
        nested = Path(directory) / 'portfolio-demo' / 'projects' / 'class-course-people-management'
        shutil.copytree(ROOT, nested)
        handler = functools.partial(Quiet, directory=directory)
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}/portfolio-demo/projects/class-course-people-management/'
        try:
            for ref in [''] + [x for x in parser.refs if not x.startswith('#')] + ['examples/'+n+'.csv' for n in examples]:
                with urllib.request.urlopen(base + ref) as response:
                    assert response.status == 200
                    assert response.read()
            # Hash routes all load this same HTML, so no rewrite is needed.
            with urllib.request.urlopen(base+'index.html#offerings?classid=1') as response:
                assert response.read().decode('utf-8') == html
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
    print('PASS: relative resources, nested HTTP deployment, CSV files, CSP, no runtime network calls, scoped CSS, encoding and sensitive-file checks')
    print('NOT TESTED: browser rendering, mobile layout, native form/file/drag events, original Moodle visual comparison')

if __name__ == '__main__':
    run()

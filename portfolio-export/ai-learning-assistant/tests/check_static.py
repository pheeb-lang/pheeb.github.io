"""Standard-library-only checks; serves a copied export under a nested Pages-like path."""
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from shutil import copytree
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen
import re

ROOT = Path(__file__).resolve().parents[1]


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'img', 'link'):
            path = attrs.get('src', attrs.get('href', ''))
            if path and not path.startswith('data:'):
                self.resources.append(path)
        if tag == 'a':
            self.links.append(attrs)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    runtime = ['index.html', 'styles.css', 'aihelper.js', 'mock-responder.js']
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    parser = Resources()
    parser.feed(html)
    assert len(parser.links) == 1
    assert parser.links[0]['href'].startswith('https://www.youtube.com/results?')
    assert parser.links[0]['rel'] == 'noopener noreferrer'
    assert "connect-src 'none'" in html
    assert '未連接即時 AI' in html
    assert 'maxlength="2000"' in html
    assert len(re.findall(r'<svg\b', html)) == 1
    for path in ROOT.rglob('*'):
        if path.is_file():
            assert not path.name.startswith('.env'), path
            assert path.suffix.lower() not in ('.php', '.pem', '.key', '.sqlite', '.db'), path
    for name in runtime:
        text = (ROOT / name).read_text(encoding='utf-8')
        assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(', text), name
        assert not re.search(r'\b(?:localStorage|sessionStorage|indexedDB)\b|document\.cookie', text), name
        assert not re.search(r'data-(?:endpoint|sesskey)|\b(?:api_key|apiKey|Authorization|Bearer)\b', text), name
        assert not re.search(r'innerHTML|insertAdjacentHTML|document\.write|\beval\s*\(', text), name
        assert not re.search(r'https?://(?!www\.youtube\.com/)|(?:127\.0\.0\.1|localhost|192\.168\.)', text), name
    css = (ROOT / 'styles.css').read_text(encoding='utf-8')
    assert not re.search(r'@import|@font-face|url\(', css)
    # Each class selector is anchored to the component; keyframes remain namespaced.
    for line in css.splitlines():
        if '.local-classgroup-' in line and '{' in line:
            assert '[data-region="aihelper"]' in line, line
    assert '@media (max-width: 575.98px)' in css
    assert '@media (prefers-reduced-motion: reduce)' in css
    assert '@keyframes aiportfolio-thinking' in css

    with TemporaryDirectory(prefix='aihelper-static-check-') as tmp:
        nested = Path(tmp) / 'portfolio-demo' / 'projects' / 'ai-learning-assistant'
        copytree(ROOT, nested, ignore=lambda _, names: [n for n in names if n == '__pycache__'])
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=tmp))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f'http://127.0.0.1:{server.server_port}/portfolio-demo/projects/ai-learning-assistant/'
            with urlopen(base) as response:
                assert response.status == 200
                assert response.read().decode('utf-8') == html
            queue = [urljoin(base, path) for path in parser.resources]
            visited = set()
            while queue:
                url = queue.pop()
                if url in visited:
                    continue
                assert url.startswith(base), url
                visited.add(url)
                with urlopen(url) as response:
                    assert response.status == 200
                    text = response.read().decode('utf-8')
                    if urlsplit(url).path.endswith('.js'):
                        assert 'javascript' in response.headers['Content-Type']
                        for path in re.findall(r'\bfrom\s+[\'"]([^\'"]+)[\'"]', text):
                            assert path.startswith('./'), path
                            queue.append(urljoin(url, path))
            assert len(visited) == 3, visited
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
    print('PASS: nested static HTTP entry, CSS and module imports (4 runtime files).')
    print('PASS: no API/storage/unsafe HTML sinks, credential fields, private service URLs or server files in runtime.')
    print('PASS: scoped styles, original responsive/reduced-motion rules, inline SVG and no font/CDN dependencies.')
    print('NOTE: these checks do not render a browser or validate real IME/mobile layout.')


if __name__ == '__main__':
    main()

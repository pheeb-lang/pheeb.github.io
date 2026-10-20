"""Extract only the utilization UI; run from any directory, no dependencies."""
from pathlib import Path
import re

OUT = Path(__file__).resolve().parents[1]
ROOT = OUT.parents[1]
def read(name):
    return (ROOT / 'frontend' / name).read_text(encoding='utf-8')
def write(name, content):
    (OUT / name).write_text(content, encoding='utf-8')

html = read('index.html')
page = html[html.index('    <div id="utilization-view">'):html.index('    <section id="instructors-view"')]
page = page.replace('查看 A 棟各教室', '查看星河學苑各教室')
page = page.replace('國定假日不開放', '展示休館日不開放（非正式國定假日日曆）')
write('index.html', '''<!doctype html>
<html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><title>教室使用率｜展示資料</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<link rel="stylesheet" href="./standalone.css"><link rel="stylesheet" href="./src/styles.css">
<script type="module" src="./src/main.js"></script></head><body><div id="utilization-demo">
<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">▦</span> 教室管理 <span class="brand-divider">/</span><span class="brand-sub">課務管理</span></div><span class="building-badge">展示資料 · 星河學苑</span></header>
<main><nav class="view-nav" aria-label="管理功能"><button type="button" data-view="utilization" aria-pressed="true">教室使用率</button></nav>
<p class="muted">展示資料：教室與預約皆為虛構。預設展示 2026/10/01–10/07；10/09–10/10 為展示休館日。查詢 11 月可檢視無預約結果。</p>
''' + page + '<footer>展示資料 · 星河學苑 · 本機統計，不連線至後端。</footer></main></div></body></html>')

main = read('src/main.js')
main = main[main.index("const format ="):]
start = main.index('function taiwanToday()')
end = main.index('\nfunction status', start)
main = main[:start] + "$('start-date').value = '2026-10-01';\n$('end-date').value = '2026-10-07';\n" + main[end:]
main = main.replace('國定假日', '展示休館日').replace('正在查詢預約資料', '正在查詢展示預約資料')
main = main.replace('以下為所選日期範圍的預約使用率。', '以下為所選日期範圍的展示預約使用率。')
write('src/main.js', '''import {fetchUtilization} from './api.js';
import {setupNavigation} from './navigation.js';
const root = document.getElementById('utilization-demo');
const $ = id => root.querySelector('[id="' + id + '"]');
setupNavigation(document, window, () => {});
''' + main + "\n$('query-form').requestSubmit();\n")
navigation = read('src/navigation.js').split('// Give the full-screen')[0]
navigation = navigation.replace("document.querySelectorAll('[data-view]')", "document.querySelectorAll('#utilization-demo [data-view]')")
write('src/navigation.js', navigation)
api = read('src/api.js')
api = api[api.index('function nonnegative'):api.index('export async function fetchUtilization')]
api = api.replace('後端回傳', '展示資料').replace('後端', '展示').replace('API', '資料')
write('src/api.js', "import {buildReport, parsePeriod} from './utilization.js';\n" + api + '''export async function fetchUtilization(start, end, signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  parsePeriod(start, end);
  return validateReport(buildReport(start, end));
}
''')

css = read('src/styles.css').split('/* 每日課表')[0]
nav = read('src/styles.css')
nav = nav[nav.index('.view-nav{'):nav.index('.session-filters{')]
css += nav + '@media(max-width:520px){.view-nav button{padding:10px 15px}}'
def scope(block):
    out = ''; pos = 0
    while pos < len(block):
        opening = block.find('{', pos)
        if opening < 0: break
        selector = block[pos:opening].strip(); depth = 1; end = opening + 1
        while depth:
            depth += (block[end] == '{') - (block[end] == '}'); end += 1
        body = block[opening+1:end-1]
        if selector.startswith('@media'):
            out += selector + '{' + scope(body) + '}\n'
        else:
            selectors = ['#utilization-demo' if s.strip() in (':root', 'body') else '#utilization-demo ' + s.strip() for s in selector.split(',')]
            out += ','.join(selectors) + '{' + body + '}\n'
        pos = end
    return out
write('src/styles.css', scope(css))
write('standalone.css', '/* Only standalone page uses this reset; omit when embedding. */\nbody{margin:0}\n')
print('Exported original utilization markup, renderer, validator, navigation and scoped CSS.')

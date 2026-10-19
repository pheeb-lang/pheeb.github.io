"""Extract the reusable utilization UI without changing the source application."""
from pathlib import Path
import re

target = Path(__file__).resolve().parents[1]
root = target.parents[1]
source = root / 'frontend'
(target / 'src').mkdir(exist_ok=True)
html = (source / 'index.html').read_text(encoding='utf-8')
html = html.split('    <section id="instructors-view"')[0]
html = re.sub(r'    <nav class="view-nav".*?</nav>\n', '', html)
html = html.replace('教室與講師管理｜A棟 大安大樓', '教室使用概況｜展示資料')
html = html.replace('A棟 · 大安大樓', '展示資料 · 森光學苑')
html = html.replace('查看 A 棟', '查看森光學苑')
html = html.replace('國定假日不開放', '模擬假日不開放')
html = html.replace('/src/styles.css', './src/styles.css')
html = html.replace('<script type="module" src="/src/main.js"></script>', '<script defer src="./src/mock-data.js"></script>\n  <script defer src="./src/main.js"></script>')
html += '    <footer>展示資料：所有教室、預約及假日均為虛構 · 在瀏覽器本機計算</footer>\n  </main>\n</body>\n</html>\n'
(target / 'index.html').write_text(html, encoding='utf-8')
# The first CSS block is the entire utilization view, including its breakpoints.
css = (source / 'src/styles.css').read_text(encoding='utf-8').split('\n\n')[0]
(target / 'src/styles.css').write_text(css + '\n', encoding='utf-8')
main = (source / 'src/main.js').read_text(encoding='utf-8')
main = main[main.index('const $ ='):]
main = re.sub(r"const categoryButtons =.*?(?=const format =)", '', main, flags=re.S)
main = re.sub(r'function taiwanToday\(\).*?(?=function status)', "$('start-date').value = '2026-10-01';\n$('end-date').value = '2026-10-31';\n\n", main, flags=re.S)
main = re.sub(r'    const updatedAt =.*?(?=  } catch)', "    status('展示資料：已在本機計算所選日期的預約使用率。', 'success');\n", main, flags=re.S)
main = main.replace('查詢期間沒有排除的國定假日。', '查詢期間沒有排除的模擬假日。')
main += "\n// Show a complete example immediately; subsequent submissions use the same renderer.\n$('query-form').requestSubmit();\n"
(target / 'src/main.js').write_text(main, encoding='utf-8')
print('Exported original markup, utilization CSS and renderer.')

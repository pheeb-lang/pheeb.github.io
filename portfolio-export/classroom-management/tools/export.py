"""Run from the repository root. Only writes this export directory."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'frontend' / 'src'
(OUT / 'src').mkdir(exist_ok=True)
def write(name, content):
    (OUT / name).write_text(content, encoding='utf-8')
def read(name):
    return (SRC / name).read_text(encoding='utf-8')

html = (ROOT / 'frontend/index.html').read_text(encoding='utf-8')
page = html[html.index('    <section id="instructors-view"'):html.index('    <section id="lecturers-view"')].replace('id="instructors-view" hidden', 'id="instructors-view"')
page = re.sub(r'<h2 id="reference-title">.*?</h2>', '<h2 id="reference-title">展示課表｜星河創作實驗班 (DEMO01)</h2>', page)
page = re.sub(r'<p class="muted">.*?</p>', '<p class="muted">展示資料：所有教室、講師與課程皆為虛構。本機課表保留授課、自習、活動與假期，空白時段維持無排課。</p>', page, count=1)
page = re.sub(r'<p class="muted">前三張圖.*?</p>', '<p class="muted">本展示沿用原課表版面及日期捷徑；講師指派僅儲存在此瀏覽器。上午 09:00～12:00、下午 13:30～17:30，預約另含晚間時段。</p>', page)
page = page.replace('示範資料', '展示資料').replace('圖片課表與講師示範課堂', '展示課表與講師示範課堂').replace('快速查看圖片課表', '快速查看展示課表')
dialog = html[html.index('    <dialog id="assignment-dialog"'):html.index('    <footer>')]
write('index.html', '''<!doctype html>
<html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><title>教室管理｜展示資料</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<link rel="stylesheet" href="./src/styles.css"><script type="module" src="./src/instructors.js"></script></head>
<body><div id="classroom-demo">
<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">▦</span> 教室管理 <span class="brand-divider">/</span><span class="brand-sub">課務管理</span></div><span class="building-badge">展示資料 · 星河學苑</span></header>
<main><nav class="view-nav" aria-label="管理功能"><button type="button" data-view="instructors" aria-pressed="true">教室管理</button></nav>
''' + page + dialog + '<footer>展示資料 · 僅供作品集操作體驗，不連線至任何後端。</footer></main></div></body></html>')

for name in ['instructors.js', 'booking-store.js', 'booking-schedule.js', 'schedule-range.js', 'navigation.js']:
    content = read(name)
    if name == 'instructors.js':
        content = content.replace("const $ = id => document.getElementById(id);", "const root = globalThis.document.getElementById('classroom-demo');\nconst document = root;\nroot.getElementById = id => root.querySelector('[id=\"' + id + '\"]');\nroot.createElement = tag => root.ownerDocument.createElement(tag);\nconst $ = id => root.getElementById(id);")
        content = content.replace('classroom.instructor-assignments.v1', 'portfolio.classroom-management.assignments.v1').replace('圖片轉錄', '展示課表').replace("'reference-images'", "'demo-timetable'")
    if name == 'navigation.js':
        content = content.replace("const defaultView = 'utilization'", "const defaultView = 'instructors'")
    write('src/' + name, content)

# Preserve the original assignment/date filtering validation verbatim; replace all fixtures.
data = '''import {referenceClass, referenceSessions} from './reference-timetable.js';
export const rooms = [
  {id:'meeting-3f',name:'星河學苑 3F-討論室'},
  {id:'online-01',name:'雲端教室甲'}, {id:'online-02',name:'雲端教室乙'},
  ...Array.from({length:6},(_,i)=>({id:'A'+(201+i),name:'星河學苑 2F-'+(201+i)+' 教室'})),
  ...Array.from({length:11},(_,i)=>({id:'A'+(301+i),name:'星河學苑 3F-'+(301+i)+' 教室'})),
  {id:'A1503',name:'星河學苑 15F-創作室'}, {id:'A1501',name:'星河學苑 15F-研習室'}
];
export const instructors = [
  {id:'t1',name:'星禾老師（虛構）',specialty:'創作實務'},
  {id:'t2',name:'沐光老師（虛構）',specialty:'資料探索'},
  {id:'t3',name:'青嵐老師（虛構）',specialty:'視覺設計'},
  {id:'t4',name:'知秋老師（虛構）',specialty:'網頁實作'},
  {id:'t5',name:'雲朵老師（虛構）',specialty:'數位工具'}
];
export const sessions = referenceSessions;
'''
write('src/instructor-data.js', data + 'export function assignmentState' + read('instructor-data.js').split('export function assignmentState',1)[1])
write('src/reference-timetable.js', '''// 全部為虛構展示資料；沿用原始 session schema 與六個月份捷徑。
export const referenceClass = {id:'DEMO01',type:'展示班',name:'星河創作實驗班（展示資料）',planCode:'DEMO-001',startDate:'2025-11-04',endDate:'2026-07-10',room:'A308'};
export const referenceNotes = {'2025-11-04':'展示資料：課堂可點擊編輯講師；藍色預約卡僅供檢視。'};
const dates = ['2025-11-04','2025-11-05','2025-11-06','2025-11-07','2025-11-08','2025-12-01','2026-01-06','2026-05-04','2026-06-04','2026-07-01'];
const subjects = ['創意工具入門','互動網頁實作','自習','創作分享活動','展示假期'];
export const referenceSessions = dates.flatMap((date,day)=>[
  {start:'09:00',end:'12:00',label:'上午'}, {start:'13:30',end:'17:30',label:'下午'}
].map((slot,i)=>{
  const n = day % 5;
  const kind = ['lesson','lesson','self-study','event','holiday'][n];
  return {id:`DEMO-${day}-${i}`,source:'demo-timetable',classId:referenceClass.id,classType:referenceClass.type,className:referenceClass.name,
    classStartDate:referenceClass.startDate,classEndDate:referenceClass.endDate,planCode:referenceClass.planCode,
    courseId:`DEMO-C${n}`,course:subjects[n],courseDays:2,kind,date,start:slot.start,end:slot.end,room:'A308',
    lesson:`第 ${i+1} / 2 堂・${slot.label}`,primaryId:kind==='lesson' && !(n===1 && i===0)?'t4':'',backupId:kind==='lesson' && !(n===1 && i===1)?'t3':''};
}));
''')
api = read('api.js')
validator = api[api.index('export function validateEvents'):api.index('export async function fetchEvents')]
write('src/api.js', "import {demoBookings} from './mock-bookings.js';\n" + validator + '''// No networking: the existing store consumes the same validated event structure.
export async function fetchEvents(start,end,signal) {
  if (signal?.aborted) throw new DOMException('Aborted','AbortError');
  return validateEvents(demoBookings.filter(event => event.start.slice(0,10)>=start && event.start.slice(0,10)<end).map(event=>({...event})));
}
''')
write('src/mock-bookings.js', '''// 虛構預約，涵蓋三時段、空白教室及原日期捷徑。
const dates = ['2025-11-04','2025-11-05','2025-12-01','2026-01-06','2026-05-04','2026-06-04','2026-07-01'];
export const demoBookings = dates.flatMap((date,i)=>[
  ['morning','09:00','12:00','A201','星塵繪本工作坊'],
  ['afternoon','13:30','17:30','A302','森林故事設計'],
  ['evening','18:30','21:30','online-01','雲端創作交流']
].map(([timeSlot,start,end,resourceId,title],j)=>({id:`DEMO-E${i}-${j}`,bookingId:`DEMO-B${i}-${j}`,title,instructorName:'星禾老師（虛構）',resource:resourceId,resourceId,courseCode:`DEMO-${j}`,courseType:'展示班',timeSlot,start:`${date}T${start}:00+08:00`,end:`${date}T${end}:00+08:00`})));
''')

css = read('styles.css').split('/* 講師管理：依參考圖排列')[0]
css = re.sub(r'/\*.*?\*/','',css,flags=re.S)
# Keep original declarations and media queries, scope every selector; omit unrelated charts/tables.
unneeded = r'bar-|#bars|calculation|comparison|detail-grid|#holidays|query-panel|date-arrow|result-heading|timezone|session-filters|sessions-table|course-cell|primary-name|unassigned|edit-assignment|events-table|legend-filtered'
def scope(block):
    out = ''; pos = 0
    while pos < len(block):
        opening = block.find('{',pos)
        if opening < 0: break
        selector = block[pos:opening].strip(); depth = 1; end = opening+1
        while depth:
            depth += (block[end]=='{')-(block[end]=='}'); end += 1
        body = block[opening+1:end-1]
        if selector.startswith('@media'):
            inner = scope(body)
            if inner: out += selector+'{'+inner+'}\n'
        else:
            sels = []
            for s in selector.split(','):
                s = s.strip()
                if re.search(unneeded,s): continue
                sels.append('#classroom-demo' if s in [':root','body'] else '#classroom-demo '+s)
            if sels: out += ','.join(sels)+'{'+body+'}\n'
        pos = end
    return out
write('src/styles.css', scope(css))
# The host-body reset is restricted to the standalone file; embedded CSS remains scoped.
write('standalone.css', 'body{margin:0}\n')
index = (OUT/'index.html').read_text(encoding='utf-8').replace('<link rel="stylesheet"', '<link rel="stylesheet" href="./standalone.css"><link rel="stylesheet"',1)
write('index.html',index)
print('Exported classroom-management: plain HTML/CSS/ES modules, no build required.')

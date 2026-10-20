"""Repository-only verification; never connects to the backend or database.
Requires the ORIGINAL project's Python dependencies to compare its pure function.
"""
from pathlib import Path
from datetime import date, datetime
import json
import subprocess
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen
import re

root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
sys.path.insert(0,str(repo/'backend'))
from app.services.utilization_service import build_report

js = """
import {rooms,reservations,closedDates} from './src/mock-data.js';
import {buildReport} from './src/utilization.js';
const ranges=[['2026-10-01','2026-10-07'],['2026-10-09','2026-10-10'],['2026-11-01','2026-11-07'],['2026-09-29','2026-10-11'],['2026-10-01','2026-10-01'],['2026-10-04','2026-10-04'],['2026-01-01','2026-12-31']];
console.log(JSON.stringify({rooms,reservations,closedDates,reports:ranges.map(([a,b])=>buildReport(a,b))}));
"""
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True,encoding='utf-8'))
rows=[{**r,'start_date':datetime.fromisoformat(r['start_date']).replace(tzinfo=None),'end_date':datetime.fromisoformat(r['end_date']).replace(tzinfo=None)} for r in data['reservations'] if r['status_id']==1]
for report in data['reports']:
    start,end=date.fromisoformat(report['start_date']),date.fromisoformat(report['end_date'])
    closed={date.fromisoformat(d):name for d,name in data['closedDates'].items() if start<=date.fromisoformat(d)<=end}
    expected=build_report(data['rooms'],rows,start,end,report['location'],closed)
    for key in ('summary','rooms','holidays','open_days','start_date','end_date','timezone','location'):
        assert report[key]==expected[key],(start,end,key,report[key],expected[key])
print('PASS: 7 ranges exactly match original Python build_report, using the same fictional calendar and data.')

class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(repo)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
    base=f'http://127.0.0.1:{server.server_port}/portfolio-export/classroom-utilization/dist/'
    html=urlopen(base+'?view=utilization').read().decode('utf-8')
    urls=re.findall(r'(?:href|src)="(\./[^"]+)"',html)
    urls += ['./src/'+p.name for p in (root/'dist/src').glob('*.js')]
    for url in urls:
        response=urlopen(base+url[2:]); assert response.status==200
        assert response.read()==(root/'dist'/url[2:]).read_bytes()
    assert '每間教室，使用得如何？' in html
    print('PASS: nested directory HTTP HTML/CSS/module resources all return 200 and exact artifact bytes.')
finally:
    server.shutdown();server.server_close();thread.join()

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport, parsePeriod} from '../src/utilization.js';
import {fetchUtilization, validateReport} from '../src/api.js';
import {rooms, reservations, closedDates} from '../src/mock-data.js';

test('default summary and all room figures agree',()=>{
  const data=validateReport(buildReport('2026-10-01','2026-10-07'));
  assert.deepEqual(data.summary,{room_count:4,booked_hours:101.5,available_hours:280,utilization:36.25});
  assert.deepEqual(data.rooms.map(r=>r.booked_hours),[70,29,2.5,0]);
  assert.deepEqual(data.rooms.map(r=>r.reservation_count),[14,11,2,0]);
  assert.equal(data.rooms.reduce((s,r)=>s+r.booked_hours,0),data.summary.booked_hours);
  assert.equal(data.rooms.reduce((s,r)=>s+r.available_hours,0),data.summary.available_hours);
});
test('closed-only dates have no denominator; weekends remain open',()=>{
  const data=buildReport('2026-10-09','2026-10-10');
  assert.equal(data.open_days,0); assert.equal(data.holidays.length,2);
  assert.equal(data.summary.utilization,null); assert.equal(data.summary.booked_hours,0);
  assert.equal(buildReport('2026-10-11','2026-10-11').open_days,1);
});
test('no reservations keeps all rooms with zero utilization',()=>{
  const data=buildReport('2026-11-01','2026-11-07');
  assert.equal(data.rooms.length,4); assert.equal(data.summary.utilization,0);
  assert.ok(data.rooms.every(r=>r.booked_hours===0 && r.reservation_count===0));
});
test('no rooms returns original empty report semantics',()=>{
  const data=buildReport('2026-10-01','2026-10-01',{rooms:[],reservations,closedDates});
  assert.equal(data.summary.utilization,null); assert.deepEqual(data.rooms,[]);
});
test('same-day clipping and excluded/status rules',()=>{
  const data=buildReport('2026-10-01','2026-10-01');
  assert.deepEqual(data.rooms.map(r=>r.booked_hours),[10,5,1,0]);
  assert.equal(data.summary.available_hours,40);
});
test('validation matches original backend limits',()=>{
  for(const [a,b] of [['2026-02-30','2026-03-01'],['2026-10-02','2026-10-01'],['1999-12-31','2000-01-01'],['2026-01-01','2027-01-02']])
    assert.throws(()=>parsePeriod(a,b));
  assert.doesNotThrow(()=>parsePeriod('2026-01-01','2026-12-31'));
  assert.throws(()=>validateReport({...buildReport('2026-10-01','2026-10-01'),rooms:null}));
});
test('local adapter supports cancellation and never fetches',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('Network must never be called');};
  try {
    assert.equal((await fetchUtilization('2026-10-01','2026-10-07')).summary.utilization,36.25);
    const c=new AbortController(); c.abort();
    await assert.rejects(fetchUtilization('2026-10-01','2026-10-07',c.signal),{name:'AbortError'});
  } finally {globalThis.fetch=original;}
});

// Execute original DOM renderer and submit handler using a minimal DOM fixture.
// This verifies text/values/events, not real browser layout or native date UI.
test('renderer, query, empty data, holidays and errors work together',async()=>{
  class Element {
    constructor(){this.children=[];this.attrs={};this.style={};this.hidden=false;this.textContent='';this.handlers={};this.value='';}
    setAttribute(k,v){this.attrs[k]=v;}
    append(...items){this.children.push(...items);}
    replaceChildren(){this.children=[];}
    addEventListener(k,f){this.handlers[k]=f;}
    requestSubmit(){this.pending=this.handlers.submit({preventDefault(){}});}
  }
  const ids=new Map();
  const element=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
  const root={querySelector:s=>element(s.match(/id="([^"]+)"/)[1])};
  const button=new Element();button.dataset={view:'utilization'};
  globalThis.document={getElementById:id=>id==='utilization-demo'?root:element(id),createElement:()=>new Element(),querySelectorAll:()=>[button]};
  const location={href:'http://localhost/portfolio/demo/?view=utilization'};
  globalThis.window={location,addEventListener(){},history:{state:null,pushState(s,t,u){location.href=u;},replaceState(s,t,u){location.href=u;}}};
  try {
    await import('../src/main.js');await element('query-form').pending;
    assert.equal(element('overall-rate').textContent,'36.25%');
    assert.equal(element('booked-hours').textContent,'101.5 h');
    assert.equal(element('bars').children.length,4);
    assert.equal(element('rooms-body').children.length,4);
    const rows=element('rooms-body').children;
    for(let i=0;i<4;i++) {
      assert.equal(rows[i].children[0].textContent,element('bars').children[i].children[0].textContent);
      assert.equal(rows[i].children[4].textContent,element('bars').children[i].children[2].textContent);
    }
    async function query(a,b){element('start-date').value=a;element('end-date').value=b;element('query-form').requestSubmit();await element('query-form').pending;}
    await query('2026-11-01','2026-11-07');assert.equal(element('overall-rate').textContent,'0%');
    await query('2026-10-09','2026-10-10');assert.equal(element('overall-rate').textContent,'不適用');assert.equal(element('holidays').children.length,2);
    await query('2026-10-07','2026-10-01');assert.equal(element('status').attrs.role,'alert');
    await query('2026-01-01','2027-01-02');assert.match(element('status').textContent,/366/);
    await query('2026-10-01','2026-10-07');assert.equal(element('overall-rate').textContent,'36.25%');assert.equal(element('submit-button').disabled,false);
  } finally {delete globalThis.document;delete globalThis.window;}
});

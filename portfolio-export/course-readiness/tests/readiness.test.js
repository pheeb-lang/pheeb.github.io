import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sessions, instructors} from '../demo-data.js';
import {inspectLesson, overlaps, canTeach} from '../course-readiness.js';
import {createStore, storageKey} from '../local-store.js';
const context = {dataReady:true};
const inspect = (item, items=sessions, options=context) => inspectLesson(item,items,options);
const memory = () => {const data=new Map(); return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('six representative lessons retain original merged states and counts', () => {
  assert.deepEqual(sessions.map(item=>inspect(item).state), ['primary-missing','pending','conflict','conflict','conflict','complete']);
});
test('full successful workflow persists one lesson without overwriting others', async () => {
  const storage=memory(), store=createStore(storage), before=structuredClone(store.items.slice(1));
  const draft={...store.items[0],primaryId:instructors[0].id,accepted:false,opened:false};
  assert.equal(inspect(draft,store.items).eligible,false);
  draft.accepted=true;
  await store.load();
  assert.equal(inspect(draft,store.items).eligible,true);
  store.save(draft.id,{primaryId:draft.primaryId,accepted:true,opened:true});
  assert.equal(inspect(store.items[0],store.items).state,'complete');
  assert.deepEqual(store.items.slice(1),before);
  const reloaded=createStore(storage);
  assert.deepEqual(reloaded.items.map(item=>inspect(item,reloaded.items).state),store.items.map(item=>inspect(item,store.items).state));
  store.save('demo-2',{primaryId:'demo-t3',accepted:true,opened:false});
  assert.equal(createStore(storage).items[0].opened,true);
  assert.ok(storage.getItem(storageKey));
});
test('hidden lessons still cause teacher and room conflicts', () => {
  const visible=sessions.filter(item=>item.id==='demo-3');
  assert.equal(visible.length,1);
  assert.equal(inspect(visible[0]).teacherConflicts[0].id,'demo-4');
  assert.equal(inspect(sessions[3]).roomConflicts[0].id,'demo-5');
  assert.equal(inspect(sessions[3]).eligible,false);
});
test('qualification remains independent of assignment, all blockers prevent opening', () => {
  assert.equal(canTeach('demo-t4','視覺化專題'),false);
  for (const item of sessions.slice(2,5)) assert.equal(inspect({...item,accepted:true}).eligible,false);
  assert.equal(inspect({...sessions[0],primaryId:'unknown',accepted:true}).eligible,false);
  const good={...sessions[0],primaryId:'demo-t1',accepted:true};
  assert.equal(inspect(good,sessions,{dataReady:false,dataError:'模擬載入失敗'}).eligible,false);
  assert.equal(inspect({...good,accepted:false}).eligible,false);
  assert.equal(inspect({...good,opened:false}).state,'pending');
});
test('strict interval overlap excludes touching boundaries and self', () => {
  const base=sessions[0];
  assert.equal(overlaps(base,{...base,start:'12:00',end:'13:00'}),false);
  assert.equal(overlaps(base,{...base,start:'11:59',end:'13:00'}),true);
  assert.equal(inspect({...base,primaryId:'demo-t1',accepted:true},[base]).roomConflicts.length,0);
  assert.equal(overlaps({startAt:'2026-11-05T23:00:00+08:00',endAt:'2026-11-06T01:00:00+08:00'}, {date:'2026-11-06',start:'00:30',end:'02:00'}),true);
  const meeting={id:'meeting-test',kind:'meeting',room:base.room,date:base.date,start:'10:00',end:'11:00',course:'虛構會議'};
  assert.equal(inspect(base,[base,meeting]).roomConflicts.length,1);
  assert.equal(inspect(base,[base,meeting]).teacherConflicts.length,0);
});
test('local loading gates readiness; storage failure does not mutate lessons', async () => {
  const store=createStore(memory());
  const loading=store.load(); assert.equal(store.ready,false); await loading; assert.equal(store.ready,true);
  store.items.length=0;
  await assert.rejects(store.load(), /載入失敗/);
  assert.equal(store.ready,false); assert.match(store.error,/載入失敗/);
  const broken=createStore({getItem:()=>'{',setItem:()=>{throw new Error('quota');}});
  assert.ok(broken.warning);
  assert.throws(()=>broken.save('demo-1',{primaryId:'demo-t1',accepted:true,opened:true}));
  assert.equal(broken.items[0].primaryId,'');
});
test('HTML relative assets exist and runtime has no remote dependencies', async () => {
  const root=new URL('../',import.meta.url), html=await readFile(new URL('index.html',root),'utf8');
  for (const path of [...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(match=>match[1])) await readFile(new URL(path,root));
  for (const file of ['app.js','course-readiness.js','local-store.js','demo-data.js','styles.css']) {
    const text=await readFile(new URL(file,root),'utf8');
    assert.doesNotMatch(text,/https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|\/api\//);
  }
  const app=await readFile(new URL('app.js',root),'utf8');
  assert.match(app,/instructor-accepted'\)\.checked = false/);
  assert.match(html,/sessions-empty/);
});

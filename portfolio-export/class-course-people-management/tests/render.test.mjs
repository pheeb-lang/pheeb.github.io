// Template and state tests with a deliberately minimal DOM double.
// This does NOT emulate a browser, CSS, native controls, or real navigation.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

export async function runChecks(){
 const source={};for(const f of ['data.js','domain.js','app.js'])source[f]=await readFile(new URL('../assets/'+f,import.meta.url),'utf8');
 const tests=[];
 const fixture=(hash='',stored=null)=>{
  const nodes=new Map();const events={};let saved=stored;
  function node(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',className:'',hidden:false,disabled:false,value:'',dataset:{},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},querySelector(s){return node(key+' '+s);},querySelectorAll(){return [];},focus(){this.focused=true;}});return nodes.get(key);}
  const app=node('#app');app.querySelector=selector=>{if(selector==='#workspace-search'&&!app.innerHTML.includes('id="workspace-search"'))return null;return node(selector);};app.querySelectorAll=selector=>{if(selector==='.import-form'){const match=app.innerHTML.match(/data-kind="([^"]+)"/);if(match){const form=node('import');form.dataset.kind=match[1];form.elements||={file:{files:[]}};return [form];}}return [];};
  const context=vm.createContext({structuredClone,URLSearchParams,TextDecoder,setTimeout,clearTimeout,console,document:{querySelector:node,createElement:()=>node('new')},location:{hash},localStorage:{getItem:()=>saved,setItem:(_,v)=>saved=v},window:{addEventListener:(n,f)=>events[n]=f,scrollTo(){}},FormData:class{constructor(form){return Object.entries(form.values||{})}}});
  for(const f of ['data.js','domain.js','app.js'])new vm.Script(source[f],{filename:f}).runInContext(context);
  return {app,node,context,go(hash){context.location.hash=hash;events.hashchange();},saved:()=>saved};
 };
 let f=fixture();assert(f.app.innerHTML.includes('班別管理'));assert(f.app.innerHTML.includes('DEMO-WEB'));tests.push('首次啟動有完整班別與匯入區，JS 可執行');
 f.go('#classes?classgroupid=1');assert(f.app.innerHTML.includes('共 24 筆符合的班級'));assert(f.app.innerHTML.includes('每頁 20 筆'));assert(f.app.innerHTML.includes('data-region="new-class-row" hidden'));assert.equal((f.app.innerHTML.match(/管理班級課程<\/a>/g)||[]).length,20);tests.push('班級列表 20 筆與第 2 頁連結／隱藏新增列');
 f.node('[data-action="add-class"]').onclick();assert.equal(f.node('[data-region="new-class-row"]').hidden,false);assert.equal(f.node('[data-action="add-class"]').disabled,true);tests.push('新增資料點擊顯示列並停用重複新增按鈕');
 f.go('#classes?classgroupid=1&page=1');assert.equal((f.app.innerHTML.match(/管理班級課程<\/a>/g)||[]).length,4);tests.push('第 2 頁剩餘 4 筆');
 f.go('#classes?classgroupid=1&code=DEMO-WEB-00&academicstaff=晴空&tutor=星河');assert(f.app.innerHTML.includes('共 6 筆符合的班級'));tests.push('三欄組合篩選與原本的排序方向');
 f.go('#classes?classgroupid=1&code=nothing');assert(f.app.innerHTML.includes('共 0 筆符合的班級'));tests.push('無符合結果仍可使用搜尋與新增');
 f.go('#offerings?classid=1');assert(f.app.innerHTML.includes('DEMO-C1'));assert(f.app.innerHTML.includes('班級課程：網頁應用實作 1 班'));assert(f.app.innerHTML.includes('data-offering-id="1"'));assert(f.app.innerHTML.includes('name="hours[1]"'));assert(f.app.innerHTML.includes('未納入展示'));tests.push('班級 → 對應課程／講師欄位與未納入入口');
 f.app.onclick({target:{closest:()=>({dataset:{action:'publish',id:'2'}})}});assert(f.node('#confirmation').open);f.node('#confirm-no').onclick();assert(!f.node('#confirmation').open);assert.equal(f.saved(),null);tests.push('發布確認可取消，未寫入本機狀態');
 f.app.onclick({target:{closest:()=>({dataset:{action:'publish',id:'2'}})}});f.node('#confirm-yes').onclick();assert.equal(JSON.parse(f.saved()).offerings.find(o=>o.id===2).status,'published');tests.push('確認發布串接本機規則與保存');
 const after=f.saved();let reload=fixture('#offerings?classid=1',after);assert.equal((reload.app.innerHTML.match(/已發布<\/span>/g)||[]).length,2);tests.push('從已保存 JSON 初始化並顯示更新狀態（非瀏覽器刷新）');
 f.go('#students?classid=1&import=1');assert(f.app.innerHTML.includes('student1@example.com'));assert(f.app.innerHTML.includes('data-kind="students"'));assert(f.app.innerHTML.includes('href="#students?classid=1"'));tests.push('課程 → 學生名單與本班匯入／取消連結');
 const csv=await readFile(new URL('../examples/students.csv',import.meta.url));const fakeFile={name:'students.csv',size:csv.length,arrayBuffer:async()=>csv.buffer.slice(csv.byteOffset,csv.byteOffset+csv.byteLength)};
 f.node('import').elements.file.files=[fakeFile];await f.node('import').onsubmit({preventDefault(){}});assert(f.app.innerHTML.includes('portfolio.student@example.com'));assert(f.node('#notice').textContent.includes('本機新建 1 筆'));const savedStudents=f.saved();tests.push('真實匯入處理器：模擬 file 讀取 → CSV → 交易 → 更新學生模板（無原生 file input）');
 f.node('import').elements.file.files=[{name:'students.xlsx',size:12}];await f.node('import').onsubmit({preventDefault(){}});assert(f.node('#notice').textContent.includes('CSV'));assert.equal(f.saved(),savedStudents);tests.push('匯入處理器拒絕 XLSX，不變更本機資料');
 f.go('#mycourses?classid=1');assert(f.app.innerHTML.includes('local-classgroup-course-card'));assert(f.app.innerHTML.includes('id="workspace-search"'));f.go('#mycourses?code=nomatch');assert(f.app.innerHTML.includes('沒有符合篩選的班級'));tests.push('我的班級卡片、搜尋與空結果');
 f.go('#offerings?classid=999999');assert(f.app.innerHTML.includes('找不到班級'));tests.push('不存在班級 ID 有可返回入口');
 const poisoned=JSON.parse(after);poisoned.classes[0].name='<img src=x onerror=alert(1)>';poisoned.masters[0].name='<script>alert(1)</script>';f=fixture('#offerings?classid=1',JSON.stringify(poisoned));assert(!f.app.innerHTML.includes('<img src=x'));assert(!f.app.innerHTML.includes('<script>alert'));assert(f.app.innerHTML.includes('&lt;img'));tests.push('模板安全逸出班級／課程名稱，不作為 HTML');
 f.node('#reset').onclick();f.node('#confirm-no').onclick();assert.equal(JSON.parse(f.saved()).classes[0].name,poisoned.classes[0].name);f.node('#reset').onclick();f.node('#confirm-yes').onclick();assert.equal(JSON.parse(f.saved()).classes.length,28);assert.equal(JSON.parse(f.saved()).classes[0].name,'網頁應用實作 1 班');tests.push('重設取消保留、確認恢復完整 fixture');
 return tests;
}
if(typeof process!=='undefined'&&process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])console.log((await runChecks()).join('\n'));

// Run with node tests/domain.test.mjs. Built-in Node modules only.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

export async function runChecks() {
 const context=vm.createContext({structuredClone,console});
 for(const file of ['data.js','domain.js'])vm.runInContext(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),context);
 const D=context.DemoDomain;let db=context.createDemoData();const passed=[];
 const check=(name,fn)=>{fn();passed.push(name);};
 const transaction=fn=>{const copy=structuredClone(db),result=fn(copy);db=copy;return result;};
 const classData={code:'DEMO-WEB-TEST',name:'虛構測試班',startdate:'2026-11-01',enddate:'2027-04-30',externalcode:'WEB-TEST',location:'示範測試區',academicstaffname:'晴空教務',tutorname:'星河導師'};
 check('初始資料：多班別／超過 20 班／多門課／共用人員／三種課程狀態',()=>{assert.equal(db.programs.length,2);assert.equal(db.classes.length,28);assert.equal(db.offerings.length,84);assert.deepEqual(new Set(db.offerings.map(o=>o.status)),new Set(['draft','published','error']));assert(db.classes.filter(c=>c.tutorname==='星河導師').length>1);});
 let created;
 check('班級新增自動依課綱建立草稿',()=>{created=transaction(c=>D.addClass(c,1,classData));const os=db.offerings.filter(o=>o.classid===created.id);assert.equal(os.length,3);assert(os.every(o=>o.status==='draft'&&o.courseid===null));});
 check('重複班級代碼、同人教務／導師、倒置與無效日期、空白／錯誤代碼阻擋',()=>{assert.throws(()=>transaction(c=>D.addClass(c,1,classData)),/重複/);for(const delta of [{code:'bad code'},{code:'X',tutorname:'晴空教務'},{code:'X',enddate:'2025-01-01'},{code:'X',startdate:'2026-02-30'},{code:'X',location:''}])assert.throws(()=>transaction(c=>D.addClass(c,1,{...classData,...delta})));});
 check('補草稿具冪等性、不重複班級開課',()=>{assert.equal(transaction(c=>D.generate(c,created.id)),0);});
 const o=db.offerings.find(o=>o.classid===created.id);
 check('時數與講師選擇、空選項保留原指派、禁止無效指派',()=>{transaction(c=>D.assignment(c,o.id,15,'person:3'));assert.equal(db.offerings.find(x=>x.id===o.id).instructortext,'青禾講師');transaction(c=>D.assignment(c,o.id,18,''));assert.equal(db.offerings.find(x=>x.id===o.id).instructorpersonid,3);assert.throws(()=>transaction(c=>D.assignment(c,o.id,0,'person:3')));assert.throws(()=>transaction(c=>D.assignment(c,o.id,12,'person:999')));});
 check('排序須完整且唯一；只影響當班',()=>{const ids=db.offerings.filter(x=>x.classid===created.id).map(x=>x.id).reverse();transaction(c=>D.reorder(c,created.id,ids));assert.equal(db.offerings.find(x=>x.id===ids[0]).sortorder,10);assert.throws(()=>D.reorder(db,created.id,[ids[0],ids[0],ids[0]]));assert.equal(db.offerings.find(x=>x.classid===1).sortorder,10);});
 check('全部發布驗證失敗時不部分發布',()=>{const ids=db.offerings.filter(x=>x.classid===created.id).map(x=>x.id);assert.throws(()=>transaction(c=>D.publish(c,ids)),/講師/);assert(db.offerings.filter(x=>ids.includes(x.id)).every(x=>x.status==='draft'));});
 check('發布狀態切換、不建立 Moodle courseid、阻擋再次發布',()=>{transaction(c=>D.publish(c,[o.id]));assert.equal(db.offerings.find(x=>x.id===o.id).status,'published');assert.equal(db.offerings.find(x=>x.id===o.id).courseid,null);assert.throws(()=>transaction(c=>D.publish(c,[o.id])));});
 check('外顯碼可新增但發布時檢查班別系列',()=>{const c=transaction(copy=>D.addClass(copy,1,{...classData,code:'PREFIX-TEST',externalcode:'OTHER-TEST'}));const x=db.offerings.find(o=>o.classid===c.id);transaction(copy=>D.assignment(copy,x.id,12,'person:3'));assert.throws(()=>transaction(copy=>D.publish(copy,[x.id])),/系列/);});
 check('講師新建、重複帳號沿用、衝突阻擋、候選人必須有連結',()=>{const p=transaction(c=>D.instructor(c,'虛構測試講師','portfolio_teacher','teacher@example.com'));assert(p.userid);const same=transaction(c=>D.instructor(c,'虛構測試講師','portfolio_teacher','teacher@example.com'));assert.equal(same.id,p.id);assert.throws(()=>transaction(c=>D.instructor(c,'錯誤講師','portfolio_teacher','other@example.com')),/不一致/);});
 check('CSV BOM／引號／分隔符及跨行限制',()=>{const p=D.csv('\ufeffusername;firstname;lastname;email\nu1;"虛構;名";姓;u1@example.com');assert.equal(p.rows[0][1],'虛構;名');assert.equal(D.csv('a\tb\nx\ty').rows[0][1],'y');assert.throws(()=>D.csv('a,b\n"跨行\n資料",b'));});
 const aliases={username:['username','帳號','使用者名稱'],firstname:['firstname','名'],lastname:['lastname','姓'],email:['email','電子郵件','信箱'],idnumber:['idnumber','學號','員工編號'],password:['password','密碼']};
 const text=await readFile(new URL('../examples/students.csv',import.meta.url),'utf8'),rows=D.columns(D.csv(text),aliases);
 check('學生範例匯入：新建與既有分流、重複名單不重複成員',()=>{const result=transaction(c=>D.students(c,1,rows));assert.equal(result.created,1);assert.equal(result.existing,1);const count=db.members.filter(m=>m.classid===1).length;transaction(c=>D.students(c,1,rows));assert.equal(db.members.filter(m=>m.classid===1).length,count);});
 check('學生匯入衝突、重複帳號與格式錯誤整批回滾',()=>{const before=JSON.stringify(db);for(const rows of [[{username:'student001',firstname:'名',lastname:'姓',email:'wrong@example.com'}],[{username:'dup',firstname:'名',lastname:'姓',email:'d@example.com'},{username:'dup',firstname:'名',lastname:'姓',email:'d@example.com'}],[{username:'bad',firstname:'名',lastname:'姓',email:'invalid'}]])assert.throws(()=>transaction(c=>D.students(c,1,rows)));assert.equal(JSON.stringify(db),before);});
 check('以唯一 email 沿用帳號並連到第二班、不覆寫姓名',()=>{const u=db.users.find(u=>u.username==='portfolio_student');const r=transaction(c=>D.students(c,2,[{username:'alternative_student',firstname:'其他名',lastname:'其他姓',email:u.email,idnumber:'SECOND'}]));assert.equal(r.existing,1);assert.equal(db.members.find(m=>m.classid===2&&m.userid===u.id).idnumber,'SECOND');assert.equal(db.users.find(x=>x.id===u.id).firstname,u.firstname);});
 check('學生與課程關聯投影使用班級 ID，新增課程即包含班級既有人員',()=>{const cid=1;transaction(c=>D.offerings(c,cid,[{code:'LOCAL-TEST',name:'虛構關聯課程',hours:'12',instructor:'青禾講師'}]));const offering=db.offerings.find(o=>o.classid===cid&&db.masters.find(m=>m.id===o.coursemasterid).code==='LOCAL-TEST');assert(db.members.some(m=>m.classid===offering.classid&&m.userid===db.users.find(u=>u.username==='portfolio_student').id));});
 check('共用課程主檔更新跨班一致，已發布開課不可匯入覆寫並整批回滾',()=>{transaction(c=>D.offerings(c,1,[{code:'DEMO-C2',name:'虛構共用名稱更新',hours:'24',instructor:'遠山講師'}]));const mid=db.masters.find(m=>m.code==='DEMO-C2').id;assert(db.offerings.filter(o=>o.coursemasterid===mid).length>1);const before=JSON.stringify(db);assert.throws(()=>transaction(c=>D.offerings(c,1,[{code:'DEMO-C1',name:'禁止覆寫',hours:'12',instructor:'青禾講師'}])),/已發布/);assert.equal(JSON.stringify(db),before);});
 check('無匹配姓名只保留文字、不自動建立人員',()=>{const n=db.persons.length;transaction(c=>D.offerings(c,1,[{code:'UNLINKED',name:'虛構未連結課程',hours:'4',instructor:'不存在的示範講師'}]));const m=db.masters.find(m=>m.code==='UNLINKED');assert.equal(db.offerings.find(o=>o.coursemasterid===m.id).instructorpersonid,null);assert.equal(db.persons.length,n);});
 check('重設 fixture 可獨立重建，資料 JSON 可序列化保存',()=>{assert.equal(context.createDemoData().classes.length,28);assert.equal(JSON.parse(JSON.stringify(db)).schema,1);});
 return passed;
}
if (typeof process!=='undefined' && process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1])console.log((await runChecks()).join('\n'));

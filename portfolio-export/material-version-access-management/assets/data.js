/* Fictional, original public demo content. No production data. */
(function (root) {
 'use strict';
 const copy = x => JSON.parse(JSON.stringify(x));
 const course = (id, name, catalog) => ({id, name, editable:true, catalog});
 const item = (id, name, text, section=1) => ({id,name,module:'page',section,text});
 function seed(now=Date.now()) {
  const a=[item(101,'觀察與提問','先記錄眼前可驗證的事實，再用一句開放式問題探索原因。練習：觀察一片葉子，寫下三個問題。'),item(102,'資料整理練習','將虛構的每日閱讀分鐘數分成三組，計算每組總和。此短文為本展示自行製作。')];
  const b=[...copy(a),item(103,'小組討論指引','每人用一分鐘分享觀察。先複述夥伴的觀點，再提出一個問題。',2)];
  b[0].text='第二版練習：以顏色、形狀、紋理三種面向描述葉子，再提出問題。';
  const c=[item(201,'表達練習','用「觀點、理由、例子」三句話說明自己的想法。'),item(202,'回饋清單','回饋時描述具體行為，說明帶來的影響，再提出可實行的建議。')];
  const rules=(id,sourcecmid,audience,extra={})=>({...copy(a.find(x=>x.id===sourcecmid)),id,offeringid:1,versionid:1,sourcecmid,audience,variant:'林沐講師／基礎版',groups:[],students:[],timefrom:0,timeuntil:0,baseavailability:null,appliedavailability:null,...extra});
  return {schema:1,next:1000,availability:true,courses:[course(11,'探索方法・基礎範本（保護案例）',copy(a)),course(12,'探索方法・討論範本',copy(b)),course(13,'探索方法・進階範本', [...copy(b),item(104,'觀察日誌','每天記下一個新發現，區分觀察與推論。',2)]),course(21,'溝通表達・共用範本',copy(c))],
   masters:[{id:1,templatecourseid:11},{id:2,templatecourseid:21}],
   curricula:[{id:1,program:1,master:1,name:'探索方法',code:'EXP-01',active:true,courseid:null,sourcecourseid:12},{id:2,program:1,master:2,name:'溝通表達',code:'COM-01',active:true,courseid:null,sourcecourseid:21}],
   versions:[{id:1,curriculumid:1,sourcecourseid:11,name:'基礎版 1.0',status:'ready',timecreated:now-86400000*30,catalog:copy(a),error:''},{id:2,curriculumid:1,sourcecourseid:12,name:'討論版 2.0',status:'ready',timecreated:now-86400000*7,catalog:copy(b),error:''},{id:3,curriculumid:2,sourcecourseid:21,name:'表達版 1.0',status:'ready',timecreated:now-86400000*3,catalog:copy(c),error:''},{id:4,curriculumid:1,sourcecourseid:12,name:'秋季練習版',status:'processing',timecreated:now,started:now,catalog:copy(b),error:''}],
   offerings:[{id:1,classid:1,program:1,master:1,name:'探索方法',className:'晨光探索班',instructor:'林沐',courseid:101},{id:2,classid:2,program:1,master:1,name:'探索方法',className:'星河探索班',instructor:'周禾',courseid:null},{id:3,classid:1,program:1,master:2,name:'溝通表達',className:'晨光探索班',instructor:'許青',courseid:103},{id:4,classid:3,program:1,master:1,name:'探索方法',className:'共用課程保護案例',instructor:'江澄',courseid:11}],
   groups:[{id:1,offeringid:1,name:'觀察組'},{id:2,offeringid:1,name:'提問組'},{id:3,offeringid:2,name:'星河一組'},{id:4,offeringid:3,name:'表達組'}],
   students:[{id:1,classid:1,name:'示範學生・小岑'},{id:2,classid:1,name:'示範學生・小嶼'},{id:3,classid:2,name:'示範學生・小棠'}],
   materials:[rules(501,101,'all'),rules(502,102,'groups',{groups:[1],timefrom:1790812800000,timeuntil:1822348800000}),{...rules(503,101,'students',{students:[2]}),versionid:2,text:b[0].text},{...rules(504,102,'hidden'),versionid:2,conflict:true},{...copy(c[0]),id:505,offeringid:3,versionid:3,sourcecmid:201,audience:'hidden',variant:'',groups:[],students:[],timefrom:0,timeuntil:0}],
   jobs:[], learningRecords:[{materialid:501,studentid:1,completed:true}]};
 }
 root.MaterialData={seed,copy};
})(globalThis);

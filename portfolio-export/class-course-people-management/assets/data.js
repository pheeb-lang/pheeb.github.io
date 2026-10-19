/* Fictional fixtures only. No production data. */
globalThis.createDemoData = () => {
    const programs = [{id:1, code:'DEMO-WEB',name:'網頁應用開發班別',externalprefix:'WEB',active:1}, {id:2,code:'DEMO-DATA',name:'資料應用班別',externalprefix:'DATA',active:1}];
    const persons = ['星河導師','晴空教務','青禾講師','遠山講師','海月導師','晨光教務'].map((name,i)=>({id:i+1,userid:i+1,name,username:`staff${i+1}`,email:`staff${i+1}@example.com`,active:1}));
    const masters = ['HTML 與語意結構','CSS 響應式設計','JavaScript 程式設計','資料建模','SQL 查詢實作','資料視覺呈現'].map((name,i)=>({id:i+1,code:`DEMO-C${i+1}`,name,active:1}));
    const curricula = masters.map((m,i)=>({id:i+1,classgroupid:i<3?1:2,coursemasterid:m.id,plannedhours:[12,18,30,18,24,12][i],sortorder:(i%3+1)*10,active:1}));
    const classes = Array.from({length:28},(_,i)=>{const g=i<24?1:2;return {id:i+1,classgroupid:g,code:`DEMO-${g===1?'WEB':'DATA'}-${String(i+1).padStart(3,'0')}`,name:`${g===1?'網頁應用':'資料應用'}實作 ${i+1} 班`,startdate:`2026-${String(10-Math.floor(i/4)).padStart(2,'0')}-01`,enddate:'2027-03-31',externalcode:`${g===1?'WEB':'DATA'}-${String(i+1).padStart(3,'0')}`,location:i%2?'示範南區':'示範北區',address:'',academicstaffname:i%3?'晴空教務':'晨光教務',tutorname:i%3?'星河導師':'海月導師',status:'ready'};});
    const offerings=[]; classes.forEach(c=>curricula.filter(x=>x.classgroupid===c.classgroupid).forEach((cur,i)=>offerings.push({id:offerings.length+1,classid:c.id,classgroupid:c.classgroupid,coursemasterid:cur.coursemasterid,curriculumid:cur.id,actualhours:cur.plannedhours,instructorpersonid:i===2?null:3+i,instructortext:i===2?'待連結示範講師':persons[2+i].name,status:c.id===2&&i===2?'error':i===0?'published':'draft',source:i===2?'import':'curriculum',sortorder:cur.sortorder,courseid:i===0?1000+c.id:null})));
    const users = persons.map(p=>({...p,firstname:p.name,lastname:'',suspended:0,deleted:0}));
    for(let i=1;i<=45;i++)users.push({id:100+i,username:`student${String(i).padStart(3,'0')}`,firstname:`同學${String(i).padStart(2,'0')}`,lastname:'示範',email:`student${i}@example.com`,idnumber:`S${String(i).padStart(3,'0')}`,deleted:0,suspended:0});
    const members=[];classes.forEach(c=>{for(let j=0;j<8;j++){const uid=101+(c.id+j-1)%45;members.push({classid:c.id,userid:uid,idnumber:users.find(u=>u.id===uid).idnumber,active:1});}});
    return {schema:1,programs,persons,masters,curricula,classes,offerings,users,members};
};

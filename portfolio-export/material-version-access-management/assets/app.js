/* Static conversion of templates.php, content.php and material_form.php. */
(function(){
 'use strict';
 const D=MaterialDomain,KEY='portfolio-material-version-access-v1',app=document.getElementById('app');
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={hidden:'不開放',all:'全班可見',groups:'指定群組',students:'指定學生',queued:'等待處理',processing:'處理中',ready:'已完成',error:'處理失敗（將重試）'};
 let state,storage=true,failNext=false,flash='';
 function load(){let raw;try{raw=localStorage.getItem(KEY);}catch(e){storage=false;}try{state=raw?JSON.parse(raw):MaterialData.seed();if(state.schema!==1||!['courses','curricula','versions','offerings','materials','jobs','groups','students'].every(k=>Array.isArray(state[k])))throw Error('資料格式不符');}catch(e){state=MaterialData.seed();flash='展示資料格式無法讀取，已還原範例資料。';}}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storage=false;notice('瀏覽器無法保存展示資料；目前變更僅留在記憶體，重新整理後會遺失。','error');}}
 function notice(message,type='success'){document.getElementById('notice').innerHTML=`<div class="alert alert-${type}">${esc(message)}</div>`;}
 function route(){const [name,q='']=location.hash.slice(1).split('?');return {name:name||'templates',p:new URLSearchParams(q)};}
 const href=(page,id,extra='')=>`#${page}?id=${id}${extra}`;
 const button=(text,action,attrs='')=>`<button class="btn btn-secondary" type="button" data-action="${action}" ${attrs}>${esc(text)}</button>`;
 const options=(list,value)=>list.map(x=>`<option value="${x.id}"${Number(value)===x.id?' selected':''}>${esc(x.name)}</option>`).join('');
 function table(head,rows){return `<div class="table-responsive"><table class="generaltable"><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${head.length}">尚無資料</td></tr>`}</tbody></table></div>`;}
 const time=t=>new Date(t).toLocaleString('zh-TW',{hour12:false});
 const status=j=>`<span class="status status-${j.status}">${esc(labels[j.status])}</span>`;
 const note=text=>`<div class="alert alert-info">${text}</div>`;
 const check=(name,id,text,checked=false,disabled=false)=>`<label class="d-block"><input type="checkbox" name="${name}" value="${id}"${checked?' checked':''}${disabled?' disabled':''}> ${esc(text)}</label>`;
 function renderTemplates(p){const id=Number(p.get('id')||1),c=state.curricula.find(x=>x.id===id&&x.active);if(!c)throw Error('找不到共用範本。');
  app.innerHTML=`<h1>共用範本課程: ${esc(c.name)}</h1><label for="curriculum">共用範本課程</label><select id="curriculum" class="form-select">${options(state.curricula,id)}</select><p class="small text-muted">展示流程入口：原班別課程列表尚未連結 templates.php，詳見 README。</p>
  ${note('編輯共用範本後，發布具名版本。各班自行選擇版本與教材，既有班級不會被覆蓋。版本由背景工作建立，不包含學生學習紀錄。')}
  <form class="mb-4" data-form="edit"><button class="btn btn-primary">編輯共用範本</button></form>
  <form class="mb-4" data-form="bind"><label for="template-course">指定既有課程作為範本</label><select name="courseid" id="template-course" class="form-select mb-2" required>${options(state.courses.filter(x=>x.editable&&!state.offerings.some(o=>o.courseid===x.id)),c.courseid||c.sourcecourseid)}</select><button class="btn btn-secondary">儲存變更</button></form>
  <form class="mb-4" data-form="release"><label for="version-name">範本版本</label><input class="form-control mb-2" name="name" id="version-name" required maxlength="255"><button class="btn btn-primary">發布新版本</button></form>
  ${table(['範本版本','狀態','時間','描述'],state.versions.filter(x=>x.curriculumid===id).sort((a,b)=>b.id-a.id).map(v=>[esc(v.name),status(v),esc(time(v.timecreated)),esc(v.error)+(v.status!=='ready'?button('立即處理','process',`data-kind="version" data-id="${v.id}"`):'')]))}
  <p class="text-muted small">重新整理可查看模擬進度；僅已完成的版本可供班級匯入。</p><a class="btn btn-secondary" href="#offerings">選擇班級課程 →</a>`;
 }
 function renderOfferings(){app.innerHTML=`<h1>班級課程</h1><p>僅保留本流程所需的班級與課程選擇。完整班級、人員及課程發布管理未納入展示。</p>${table(['班級','課程名稱','講師','操作'],state.offerings.map(o=>[esc(o.className),esc(o.name),esc(o.instructor),`<a class="btn btn-secondary" href="${href('content',o.id)}">班級課程教材</a>`]))}`;}
 function renderContent(p){const o=D.offering(state,p.get('id')||1),versions=D.versions(state,o.id),vid=p.has('versionid')?Number(p.get('versionid')):versions[0]?.id,v=versions.find(x=>x.id===vid);if(versions.length&&!v)throw Error('此版本不屬於本班可用的範本課程。');
  const materials=state.materials.filter(x=>x.offeringid===o.id),jobs=state.jobs.filter(x=>x.offeringid===o.id).sort((a,b)=>b.id-a.id).slice(0,10);
  app.innerHTML=`<h1>${esc(o.className)} — ${esc(o.name)}</h1><a class="btn btn-secondary mb-3" href="#offerings">返回</a>
   ${note('選擇範本版本及要加入的教材。匯入後預設不開放，請設定講師版本、觀看對象與時間，再開放給學生。匯入新版會保留舊教材與學生紀錄。此展示不執行 Moodle 備份還原或學習紀錄移轉。')}
   <h3>從範本版本加入教材</h3>${v?`<label for="versionid" class="sr-only">範本版本</label><select id="versionid" class="form-select mb-3">${options(versions.map(v=>({...v,name:v.name+' — '+time(v.timecreated)})),vid)}</select><form data-form="import" class="mb-4">${v.catalog.map(x=>{const done=materials.some(m=>m.versionid===v.id&&m.sourcecmid===x.id);return check('selection',x.id,x.name+' ('+x.module+')'+(done?' — 已加入':''),!done,done);}).join('')}<button class="btn btn-primary mt-2">加入勾選教材</button></form>`:note('尚無可用的已發布範本版本，請先至「共用範本課程」發布版本。')}
   ${jobs.map(j=>`<div class="alert alert-${j.status==='error'?'error':'info'}">${status(j)}: ${esc(state.versions.find(v=>v.id===j.versionid)?.name)} ${esc(j.error)}${j.status!=='ready'?button('立即處理','process',`data-kind="import" data-id="${j.id}"`):''}</div>`).join('')}
   ${!o.courseid?`<form data-form="empty" class="mb-4"><button class="btn btn-secondary">建立空白班級課程</button></form>`:`<h3>班級課程教材</h3>${button('編輯班級課程／新增教材','editor')}<form data-form="bulk">${table(['選取','名稱','範本版本','講師／教材版本','觀看對象設定','操作'],materials.map(m=>[`<input type="checkbox" name="materials" value="${m.id}" aria-label="${esc(m.name)}">`,esc(m.name),esc(state.versions.find(v=>v.id===m.versionid)?.name||'本班教材'),esc(m.variant),esc(labels[m.audience]),`<a href="${href('material',o.id,'&cmid='+m.id)}">設定</a>${m.conflict?'<span class="small text-muted">（限制衝突案例）</span>':''}`]))}<label for="bulk-audience" class="sr-only">觀看對象設定</label><select name="audience" id="bulk-audience" class="form-select inline-select"><option value="hidden">不開放</option><option value="all">全班可見</option></select><button class="btn btn-primary ms-2">套用至勾選教材</button></form>`}`;
 }
 function localDate(t){if(!t)return '';const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
 function dateField(name,label,value){return `<div class="fitem row"><label for="${name}" class="col-form-label">${label}</label><div class="felement"><label class="small"><input type="checkbox" name="${name}enabled"${value?' checked':''}> 啟用</label><input class="form-control" id="${name}" name="${name}" type="datetime-local" value="${localDate(value)}"${value?'':' disabled'}></div></div>`;}
 function renderMaterial(p){const o=D.offering(state,p.get('id')),m=state.materials.find(x=>x.id===Number(p.get('cmid'))&&x.offeringid===o.id);if(!m)throw Error('無效教材。');const groups=state.groups.filter(x=>x.offeringid===o.id&&!x.managed),students=state.students.filter(x=>x.classid===o.classid);
  app.innerHTML=`<h1>觀看對象設定: ${esc(m.name)}</h1><p class="small text-muted">${esc(o.className)} · ${esc(state.versions.find(x=>x.id===m.versionid)?.name||'本班教材')}</p>
   <form class="mform" data-form="material" novalidate>
   <div class="fitem row"><label for="variant" class="col-form-label">講師／教材版本</label><div class="felement"><input class="form-control" id="variant" name="variant" maxlength="255" value="${esc(m.variant)}"></div></div>
   <div class="fitem row"><label for="audience" class="col-form-label">觀看對象設定</label><div class="felement"><select class="form-select" id="audience" name="audience">${Object.entries(labels).filter(([k])=>['hidden','all','groups','students'].includes(k)).map(([k,v])=>`<option value="${k}"${m.audience===k?' selected':''}>${v}</option>`).join('')}</select></div></div>
   <div class="fitem row" id="groups-row"${m.audience==='groups'?'':' hidden'}><label for="groups" class="col-form-label">指定群組</label><div class="felement"><input class="form-control mb-2" data-filter="groups" placeholder="搜尋群組" aria-label="搜尋群組"><select multiple class="form-select" name="groups" id="groups" size="4">${groups.map(x=>`<option value="${x.id}"${m.groups.includes(x.id)?' selected':''}>${esc(x.name)}</option>`).join('')}</select><p class="small">可按 Ctrl／Command 多選；手機點選多個項目。</p></div></div>
   <div class="fitem row" id="students-row"${m.audience==='students'?'':' hidden'}><label for="students" class="col-form-label">指定學生</label><div class="felement"><input class="form-control mb-2" data-filter="students" placeholder="搜尋學生" aria-label="搜尋學生"><select multiple class="form-select" name="students" id="students" size="4">${students.map(x=>`<option value="${x.id}"${m.students.includes(x.id)?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div>
   ${dateField('timefrom','開放時間',m.timefrom)}${dateField('timeuntil','結束時間',m.timeuntil)}
   <div class="fitem row"><span class="col-form-label"></span><div class="felement"><button class="btn btn-primary">儲存變更</button> <a class="btn btn-secondary" href="${href('content',o.id)}">取消</a></div></div></form>
   <p class="small text-muted">未啟用時間即不設該端界限。結束時間為不包含該時刻。此處設定僅影響模擬資料。</p>
   <details><summary>本機示範教材（公開短文）</summary><article><h3>${esc(m.name)}</h3><p>${esc(m.text)}</p><a href="materials/practice.html">另開示範練習頁</a></article></details>`;
 }
 function render(){try{D.settle(state);persist();const r=route();document.getElementById('notice').textContent='';if(r.name==='templates')renderTemplates(r.p);else if(r.name==='offerings')renderOfferings();else if(r.name==='content')renderContent(r.p);else if(r.name==='material')renderMaterial(r.p);else throw Error('找不到展示頁面。');document.title=(app.querySelector('h1')?.textContent||'教材管理')+'｜互動展示';if(flash){notice(flash);flash='';}if(!storage)notice('本機儲存不可用，變更僅保留於記憶體。','error');}catch(e){app.innerHTML=`<h1>無法開啟教材管理</h1><div class="alert alert-error">${esc(e.message)}</div><a href="#offerings" class="btn btn-secondary">返回班級課程</a> <a href="#templates">共用範本</a>`;}}
 function success(text){persist();render();notice(text);}
 const saved='已儲存。背景處理狀態列於下方，重新整理可查看進度。';
 app.addEventListener('submit',e=>{e.preventDefault();const f=e.target,fd=new FormData(f),r=route(),id=Number(r.p.get('id')||1);try{switch(f.dataset.form){
  case 'edit':document.getElementById('limitation').showModal();return;
  case 'bind':D.bind(state,id,Number(fd.get('courseid')));success('已指定範本課程。既有版本與班級教材保持原樣。');break;
  case 'release':D.release(state,id,String(fd.get('name')),Date.now(),failNext);failNext=false;success(saved);break;
  case 'import':{const v=D.versions(state,id),vid=r.p.has('versionid')?Number(r.p.get('versionid')):v[0]?.id;D.queueImport(state,id,vid,fd.getAll('selection'),Date.now(),failNext);failNext=false;success(saved);break;}
  case 'empty':D.empty(state,id);success(saved);break;
  case 'bulk':D.bulk(state,id,fd.getAll('materials'),fd.get('audience'));success('已更新班級教材觀看設定');break;
  case 'material':{const parse=name=>fd.has(name+'enabled')?(fd.get(name)?new Date(fd.get(name)).getTime():NaN):0;D.save(state,id,Number(r.p.get('cmid')),{variant:fd.get('variant'),audience:fd.get('audience'),groups:fd.getAll('groups'),students:fd.getAll('students'),timefrom:parse('timefrom'),timeuntil:parse('timeuntil')});persist();flash='已儲存變更';location.hash=href('content',id);break;}
 }}catch(err){notice(err.message,'error');document.getElementById('notice').scrollIntoView({block:'nearest'});}});
 app.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;try{if(b.dataset.action==='editor')document.getElementById('limitation').showModal();if(b.dataset.action==='process'){D.process(state,b.dataset.kind,b.dataset.id);success(saved);}}catch(err){notice(err.message,'error');}});
 app.addEventListener('change',e=>{const t=e.target,r=route();if(t.id==='curriculum')location.hash=href('templates',t.value);if(t.id==='versionid')location.hash=href('content',r.p.get('id'),'&versionid='+t.value);if(t.id==='audience'){document.getElementById('groups-row').hidden=t.value!=='groups';document.getElementById('students-row').hidden=t.value!=='students';}if(t.name==='timefromenabled'||t.name==='timeuntilenabled'){const input=document.getElementById(t.name.replace('enabled',''));input.disabled=!t.checked;if(t.checked&&!input.value)input.value=localDate(Date.now());}});
 app.addEventListener('input',e=>{if(e.target.dataset.filter){const select=document.getElementById(e.target.dataset.filter),q=e.target.value.trim().toLocaleLowerCase();for(const opt of select.options)opt.hidden=!opt.textContent.toLocaleLowerCase().includes(q);}});
 document.getElementById('refresh').onclick=()=>render();
 document.getElementById('reset').onclick=()=>document.getElementById('reset-dialog').showModal();
 document.getElementById('reset-no').onclick=()=>document.getElementById('reset-dialog').close();
 document.getElementById('reset-yes').onclick=()=>{state=MaterialData.seed();failNext=false;persist();document.getElementById('reset-dialog').close();location.hash='#templates';render();notice('已重設展示資料。');};
 document.getElementById('close-dialog').onclick=()=>document.getElementById('limitation').close();
 window.addEventListener('hashchange',render);
 load();render();
 if(new URLSearchParams(location.search).get('dev')==='1'){const dev=document.getElementById('dev');dev.hidden=false;dev.innerHTML='<h3>開發驗證工具（非正式功能）</h3><button class="btn btn-secondary" id="fail-next">下次發布／匯入模擬失敗</button> <button class="btn btn-secondary" id="availability">切換限制存取啟用狀態</button>';document.getElementById('fail-next').onclick=()=>{failNext=true;notice('已設定下一筆發布／匯入失敗（僅開發驗證）。');};document.getElementById('availability').onclick=()=>{state.availability=!state.availability;persist();notice('限制存取：'+(state.availability?'啟用':'停用'));};}
})();

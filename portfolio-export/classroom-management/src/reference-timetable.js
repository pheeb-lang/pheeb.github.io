// 全部為虛構展示資料；沿用原始 session schema 與六個月份捷徑。
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

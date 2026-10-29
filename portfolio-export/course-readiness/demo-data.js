// All names, courses and rooms are fictional. Dates never depend on today.
export const instructors = [
  {id:'demo-t1', name:'林沐禾', specialty:'互動網頁、前端開發'},
  {id:'demo-t2', name:'陳星澄', specialty:'資料分析、Python'},
  {id:'demo-t3', name:'許映安', specialty:'介面設計、互動網頁'},
  {id:'demo-t4', name:'周予森', specialty:'雲端應用、系統管理'},
];
export const rooms = [{id:'demo-r1',name:'拾光教室 201'}, {id:'demo-r2',name:'青禾教室 202'}, {id:'demo-r3',name:'晴嶼教室 203'}];
// Independent qualification records: assigning a teacher never changes these.
export const qualificationRecords = [
  ['互動網頁入門', ['demo-t1','demo-t3']], ['介面設計實作', ['demo-t3']],
  ['資料探索工作坊', ['demo-t2']], ['Python 資料練習', ['demo-t2']],
  ['視覺化專題', ['demo-t2']], ['雲端應用入門', ['demo-t4']],
];
const lesson = (id, course, room, start, end, primaryId, accepted=false, opened=false, date='2026-11-05') => ({
  id, course, room, start, end, primaryId, accepted, opened, date, kind:'lesson',
  className:'創作實作班・'+id.slice(-1)+' 組', classStartDate:date, classEndDate:date,
  lesson:start < '12:00' ? '上午' : '下午',
});
export const sessions = [
  lesson('demo-1','互動網頁入門','demo-r1','09:00','12:00',''),
  lesson('demo-2','介面設計實作','demo-r1','13:30','17:30','demo-t3'),
  lesson('demo-3','資料探索工作坊','demo-r2','09:00','12:00','demo-t2',true),
  lesson('demo-4','Python 資料練習','demo-r3','10:00','12:00','demo-t2',true),
  lesson('demo-5','視覺化專題','demo-r3','11:00','12:00','demo-t4',true),
  lesson('demo-6','雲端應用入門','demo-r3','09:00','12:00','demo-t4',true,true,'2026-11-06'),
];
export function validateAssignment(primaryId) {
  return typeof primaryId !== 'string' || (primaryId && !instructors.some(teacher => teacher.id === primaryId)) ? '請選擇有效的講師。' : '';
}

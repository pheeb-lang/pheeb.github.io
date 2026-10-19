import {referenceClass, referenceSessions} from './reference-timetable.js';
export const rooms = [
  {id:'meeting-3f',name:'星河學苑 3F-討論室'},
  {id:'online-01',name:'雲端教室甲'}, {id:'online-02',name:'雲端教室乙'},
  ...Array.from({length:6},(_,i)=>({id:'A'+(201+i),name:'星河學苑 2F-'+(201+i)+' 教室'})),
  ...Array.from({length:11},(_,i)=>({id:'A'+(301+i),name:'星河學苑 3F-'+(301+i)+' 教室'})),
  {id:'A1503',name:'星河學苑 15F-創作室'}, {id:'A1501',name:'星河學苑 15F-研習室'}
];
export const instructors = [
  {id:'t1',name:'星禾老師（虛構）',specialty:'創作實務'},
  {id:'t2',name:'沐光老師（虛構）',specialty:'資料探索'},
  {id:'t3',name:'青嵐老師（虛構）',specialty:'視覺設計'},
  {id:'t4',name:'知秋老師（虛構）',specialty:'網頁實作'},
  {id:'t5',name:'雲朵老師（虛構）',specialty:'數位工具'}
];
export const sessions = referenceSessions;
export function assignmentState(session) {
  if (session.kind && session.kind !== 'lesson') return 'not-required';
  return !session.primaryId ? 'primary-missing' : !session.backupId ? 'backup-missing' : 'complete';
}
export function validateAssignment(primaryId, backupId) {
  if ([primaryId, backupId].some(id => typeof id !== 'string' || (id && !instructors.some(t => t.id === id)))) return '請選擇有效的講師。';
  if (primaryId && primaryId === backupId) return '負責講師與備選講師不能是同一人。';
  return '';
}
export function filterSessions(items, {query = '', instructorId = '', state = '', startDate = '', endDate = ''} = {}) {
  const keyword = query.trim().toLocaleLowerCase('zh-TW');
  const roomNumber = /^\d+$/.test(keyword) ? keyword : '';
  return items.filter(item => {
    const names = [item.primaryId, item.backupId].map(id => instructors.find(t => t.id === id)?.name ?? '');
    const roomName = rooms.find(room => room.id === item.room)?.name ?? '';
    const searchable = [item.id, item.planCode, item.course, item.classType, item.className, item.lesson, item.room, roomName, ...names].join(' ').toLocaleLowerCase('zh-TW');
    const matchesQuery = roomNumber ? item.room.replace(/\D/g, '') === roomNumber : (!keyword || searchable.includes(keyword));
    return (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate) && matchesQuery && (!instructorId || item.primaryId === instructorId || item.backupId === instructorId) && (!state || assignmentState(item) === state);
  });
}

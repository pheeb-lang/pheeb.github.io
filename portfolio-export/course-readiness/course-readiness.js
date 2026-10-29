import {instructors, qualificationRecords} from './demo-data.js';
const qualifications = new Map(qualificationRecords.map(([course, ids]) => [course, new Set(ids)]));
const courseName = value => value.trim();

export function canTeach(teacherId, course) {
  return qualifications.get(courseName(course))?.has(teacherId) ?? false;
}
export function lessonRequired(item) {
  return !item.kind || item.kind === 'lesson' || Boolean(item.requiresInstructor);
}
export function interval(item) {
  return [Date.parse(item.startAt ?? `${item.date}T${item.start}:00+08:00`),
    Date.parse(item.endAt ?? `${item.date}T${item.end}:00+08:00`)];
}
export function overlaps(a, b) {
  const [left, right] = interval(a), [start, end] = interval(b);
  return left < end && start < right;
}
export function inspectLesson(item, occupied, {dataReady = false, dataError = ''} = {}) {
  const teacher = instructors.find(person => person.id === item.primaryId);
  const other = occupied.filter(value => value.id !== item.id && overlaps(item, value));
  const teacherConflicts = teacher ? other.filter(value => lessonRequired(value) && value.primaryId === teacher.id) : [];
  const roomConflicts = other.filter(value => value.room === item.room);
  const checks = [
    {key: 'teacher', ok: Boolean(teacher), label: teacher ? `主講師：${teacher.name}` : '尚未安排主講師'},
    {key: 'qualification', ok: Boolean(teacher && canTeach(teacher.id, item.course)), label: teacher && canTeach(teacher.id, item.course) ? '符合本課程示範授課資格' : '尚無符合本課程的授課資格紀錄'},
    {key: 'schedule', ok: dataReady && !teacherConflicts.length, label: !dataReady ? (dataError || '預約資料尚未載入完成') : teacherConflicts.length ? '講師衝突：' + teacherConflicts.map(value => `${value.course}（${value.start}–${value.end}）`).join('、') : '本堂講師無排課衝突'},
    {key: 'room', ok: dataReady && Boolean(item.room) && !roomConflicts.length, label: !dataReady ? '教室預約尚未完成檢查' : roomConflicts.length ? '教室衝突：' + roomConflicts.map(value => value.course).join('、') : item.room ? '本堂教室無重複預約' : '尚未指定教室'},
    {key: 'accepted', ok: Boolean(teacher && item.accepted), label: item.accepted && teacher ? '已記錄講師確認接課' : '尚未確認講師接課'},
  ];
  const eligible = checks.every(check => check.ok);
  let state = !teacher ? 'primary-missing' : teacherConflicts.length || roomConflicts.length || !canTeach(teacher.id, item.course) ? 'conflict' : item.opened && eligible ? 'complete' : 'pending';
  if (!lessonRequired(item)) state = 'not-required';
  return {checks, eligible, state, teacherConflicts, roomConflicts};
}

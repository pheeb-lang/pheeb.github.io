import {canTeach, lessonRequired, inspectLesson} from './course-readiness.js';
import {instructors, rooms, validateAssignment} from './demo-data.js';
import {createStore} from './local-store.js';
const $ = id => document.getElementById(id);
const stateLabels = {'complete':'已就緒・已確認開課','primary-missing':'缺講師','pending':'待確認開課','conflict':'有衝突／資格待補'};
const store = createStore(localStorage);
const items = store.items;
let readinessFilter = '', drawerRevision = 0, editingId, trigger;
function message(text) { $('assignment-status').textContent = text; }
if (store.warning) message(store.warning);
function lessonContext() { return {occupied: items, dataReady: store.ready, dataError: store.error}; }
function readiness(item) { const context = lessonContext(); return inspectLesson(item, context.occupied, context); }
function currentItem() { return items.find(item => item.id === editingId); }
function option(value, label) {
  const node = document.createElement('option'); node.value = value; node.textContent = label; return node;
}
function name(id) { return instructors.find(t => t.id === id)?.name ?? '尚未指派'; }
function drawerItem() { return {...currentItem(), primaryId: $('primary-instructor').value, accepted: $('instructor-accepted').checked, opened: false}; }
function updateDrawer() {
  if (!currentItem()) return;
  const item = drawerItem(), context = lessonContext(item);
  const result = inspectLesson(item, context.occupied, context);
  $('readiness-checks').replaceChildren();
  for (const check of result.checks) {
    const row = document.createElement('li'); row.className = check.ok ? 'check-pass' : 'check-pending';
    row.textContent = (check.ok ? '✓ ' : '○ ') + check.label; $('readiness-checks').append(row);
  }
  $('assignment-open').disabled = !result.eligible;
  const query = $('candidate-query').value.trim().toLocaleLowerCase('zh-TW');
  const list = $('candidate-list'); list.replaceChildren();
  let count = 0;
  for (const teacher of instructors) {
    if (query && !(teacher.name + teacher.specialty).toLocaleLowerCase('zh-TW').includes(query)) continue;
    const candidate = inspectLesson({...item, primaryId: teacher.id}, context.occupied, context);
    const qualified = canTeach(teacher.id, item.course);
    const available = qualified && context.dataReady && !candidate.teacherConflicts.length;
    if ($('candidate-available').checked && !available) continue;
    count++;
    const card = document.createElement('div'); card.className = 'candidate-card';
    const title = document.createElement('strong'); title.textContent = teacher.name + ' · ' + teacher.specialty;
    const detail = document.createElement('p'); detail.textContent = !qualified ? '本課程尚無授課資格紀錄' : !context.dataReady ? '資格符合・時段資料待確認' : candidate.teacherConflicts.length ? '時段衝突：' + candidate.teacherConflicts.map(value => value.course + ' ' + value.start + '–' + value.end).join('、') : '資格符合・本堂無排課衝突';
    const choose = document.createElement('button'); choose.type = 'button'; choose.className = 'secondary-button'; choose.disabled = !available; choose.textContent = item.primaryId === teacher.id ? '已選主講' : '選為主講';
    choose.addEventListener('click', () => { if ($('primary-instructor').value !== teacher.id) $('instructor-accepted').checked = false; $('primary-instructor').value = teacher.id; $('assignment-error').textContent = ''; updateDrawer(); });
    card.append(title, detail, choose); list.append(card);
  }
  $('candidate-status').textContent = !context.dataReady ? (context.dataError || '正在載入本堂預約，完成後才能媒合與確認開課。') : count ? `找到 ${count} 位講師。` : '沒有符合條件的講師，可取消篩選查看原因。';
}
async function openEditor(item, button) {
  editingId = item.id; trigger = button;
  const revision = ++drawerRevision;
  $('assignment-session').textContent = item.course + '｜' + item.className + '｜' + item.date + ' ' + item.start + '–' + item.end + '｜' + (rooms.find(room => room.id === item.room)?.name ?? item.room);
  $('primary-instructor').value = item.primaryId;
  $('instructor-accepted').checked = item.accepted === true;
  $('candidate-query').value = ''; $('candidate-available').checked = true;
  $('assignment-save').disabled = false;
  $('assignment-error').textContent = '';
  $('assignment-dialog').showModal(); $('assignment-dialog').scrollTop = 0; updateDrawer();
  try { const loading = store.load(); updateDrawer(); await loading; }
  catch (error) { if (revision === drawerRevision) $('assignment-error').textContent = error.message; }
  if (revision === drawerRevision && $('assignment-dialog').open) updateDrawer();
  render();
}
function sessionButton(item) {
  const editable = lessonRequired(item);
  const lessonState = readiness(item).state;
  const button = document.createElement(editable ? 'button' : 'div');
  if (editable) {
    button.type = 'button'; button.dataset.sessionId = item.id;
    button.setAttribute('aria-label', '編輯 ' + item.course + ' ' + item.className + ' ' + item.date + ' ' + item.start + ' ' + item.room + ' 講師指派');
  }
  button.className = 'schedule-session' + (editable ? '' : ' schedule-activity ' + item.kind);
  for (const [tag, text, className] of [
    ['small', item.start + '–' + item.end, 'session-time'],
    ['strong', item.course, 'session-title'],
    ['span', item.className, 'session-class'],
    ['small', '班期：' + item.classStartDate + '～' + item.classEndDate, 'session-lesson'],
    ['small', item.lesson, 'session-lesson'],
    ['span', editable ? '主講：' + name(item.primaryId) : '原圖安排・無需指派講師', 'session-instructors'],
    ['span', stateLabels[lessonState], 'assignment-badge ' + lessonState],
  ]) {
    const node = document.createElement(tag); node.textContent = text; node.className = className; button.append(node);
  }
  if (editable) button.addEventListener('click', () => openEditor(item, button));
  return button;
}

function render() {
  const states = items.map(item => readiness(item).state);
  for (const [id, state] of [['count-all',''],['count-missing','primary-missing'],['count-pending','pending'],['count-conflict','conflict'],['count-ready','complete']]) $(id).textContent = state ? states.filter(value => value === state).length : states.length;
  const visible = items.filter(item => !readinessFilter || readiness(item).state === readinessFilter);
  $('session-count').textContent = `顯示 ${visible.length} / ${items.length} 堂`;
  $('schedule').replaceChildren(); $('sessions-empty').hidden = visible.length > 0;
  for (const date of [...new Set(visible.map(item => item.date))]) {
    const day = document.createElement('section'); day.className = 'demo-day';
    const heading = document.createElement('h3'); heading.textContent = date.replaceAll('-', '/') + ' · ' + new Intl.DateTimeFormat('zh-TW', {weekday:'long',timeZone:'Asia/Taipei'}).format(new Date(date+'T00:00:00+08:00'));
    const grid = document.createElement('div'); grid.className = 'demo-rooms';
    for (const room of rooms) {
      const lessons = visible.filter(item => item.date === date && item.room === room.id);
      if (!lessons.length) continue;
      const group = document.createElement('div'); group.className = 'demo-room';
      const title = document.createElement('h4'); title.textContent = room.name;
      group.append(title, ...lessons.map(sessionButton)); grid.append(group);
    }
    day.append(heading, grid); $('schedule').append(day);
  }
}
for (const teacher of [{id:'', name:'尚未指派', specialty:''}, ...instructors]) $('primary-instructor').append(option(teacher.id, teacher.name + (teacher.specialty ? ' · '+teacher.specialty : '')));
render();
$('assignment-cancel').addEventListener('click', () => $('assignment-dialog').close());
$('assignment-dialog').addEventListener('close', () => {
  const nextTrigger = [...document.querySelectorAll('[data-session-id]')].find(button => button.dataset.sessionId === editingId);
  (nextTrigger ?? (trigger?.isConnected ? trigger : document.querySelector('[data-readiness]'))).focus();
});
$('primary-instructor').addEventListener('change', () => { $('instructor-accepted').checked = false; updateDrawer(); });
$('instructor-accepted').addEventListener('change', updateDrawer);
$('candidate-query').addEventListener('input', updateDrawer);
$('candidate-available').addEventListener('change', updateDrawer);
for (const button of document.querySelectorAll('[data-readiness]')) button.addEventListener('click', () => {
  readinessFilter = button.dataset.readiness;
  for (const node of document.querySelectorAll('[data-readiness]')) node.setAttribute('aria-pressed', String(node === button));
  render();
});
$('assignment-form').addEventListener('submit', async event => {
  event.preventDefault();
  const draft = drawerItem(), id = editingId, revision = drawerRevision;
  const error = validateAssignment(draft.primaryId, '');
  if (error) { $('assignment-error').textContent = error; return; }
  const opening = event.submitter?.value === 'open';
  if (opening) {
    $('assignment-open').disabled = true; $('assignment-save').disabled = true;
    try { const loading = store.load(); updateDrawer(); await loading; }
    catch (reason) {
      if (revision === drawerRevision) { $('assignment-error').textContent = reason.message; $('assignment-save').disabled = false; updateDrawer(); }
      return;
    }
    if (revision !== drawerRevision || editingId !== id || !$('assignment-dialog').open) return;
    $('assignment-save').disabled = false;
    const latest = drawerItem();
    const result = readiness(latest);
    if (!result.eligible) { $('assignment-error').textContent = '開課檢核未通過，請處理檢核項目後再試。'; updateDrawer(); return; }
    Object.assign(draft, latest);
  }
  const value = {primaryId: draft.primaryId, accepted: Boolean(draft.primaryId && draft.accepted), opened: opening};
  try { store.save(id, value); }
  catch { $('assignment-error').textContent = '瀏覽器無法儲存指派，請確認允許本機儲存後再試。'; updateDrawer(); return; }
  Object.assign(currentItem(), value);
  render(); $('assignment-dialog').close();
  message(draft.course + '（' + draft.date + ' ' + draft.start + '）' + (opening ? '已確認本堂開課' : '安排已儲存，尚未確認開課') + '，儲存在此瀏覽器。');
});

$('assignment-dialog').addEventListener('close', () => { drawerRevision++; });

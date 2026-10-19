import {rooms, instructors, sessions, assignmentState, validateAssignment, filterSessions} from './instructor-data.js';
import {referenceClass, referenceNotes} from './reference-timetable.js';
import {addDateDays, scheduleDates} from './schedule-range.js';
import {bookingStore} from './booking-store.js';
import {setupNavigation} from './navigation.js';
import {scheduleSlots, bookingCellKey, indexBookingCells} from './booking-schedule.js';
const root = globalThis.document.getElementById('classroom-demo');
const document = root;
root.getElementById = id => root.querySelector('[id="' + id + '"]');
root.createElement = tag => root.ownerDocument.createElement(tag);
const $ = id => root.getElementById(id);
const storageKey = 'portfolio.classroom-management.assignments.v1';
const stateLabels = {'complete': '指派完成', 'primary-missing': '待指派負責講師', 'backup-missing': '待安排備選講師', 'not-required': '無需指派講師'};
const items = sessions.map(item => ({...item}));
const timeSlots = scheduleSlots;
const todayParts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
const today = ['year', 'month', 'day'].map(type => todayParts.find(part => part.type === type).value).join('-');
$('schedule-date').value = referenceClass.startDate;
$('session-start-date').value = referenceClass.startDate;
let appliedRange = {startDate: referenceClass.startDate, endDate: addDateDays(referenceClass.startDate, 5)};
let editingId;
let trigger;
function message(text) { $('assignment-status').textContent = text; }
function loadAssignments() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid data');
    let invalid = false;
    for (const item of items) {
      if (assignmentState(item) === 'not-required') continue;
      if (!Object.hasOwn(saved, item.id)) continue;
      const value = saved[item.id];
      if (!value || validateAssignment(value.primaryId, value.backupId)) { invalid = true; continue; }
      item.primaryId = value.primaryId; item.backupId = value.backupId;
    }
    if (invalid) message('部分儲存資料無效，已改用原始示範指派。');
  } catch { message('無法讀取本機指派資料，目前顯示原始示範資料。'); }
}
function option(value, label) {
  const node = document.createElement('option'); node.value = value; node.textContent = label; return node;
}
function td(text, className = '') {
  const node = document.createElement('td'); node.textContent = text; node.className = className; return node;
}
function name(id) { return instructors.find(t => t.id === id)?.name ?? '尚未指派'; }
function openEditor(item, button) {
  editingId = item.id; trigger = button;
  $('assignment-session').textContent = item.course + '｜' + item.className + '（' + (item.source === 'demo-timetable' ? '圖片涵蓋 ' : '班期 ') + item.classStartDate + '～' + item.classEndDate + '）｜' + item.lesson + '｜' + item.date + ' ' + item.start + '–' + item.end;
  $('primary-instructor').value = item.primaryId;
  $('backup-instructor').value = item.backupId;
  $('assignment-error').textContent = '';
  $('assignment-dialog').showModal();
}
function sessionButton(item) {
  const editable = assignmentState(item) !== 'not-required';
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
    ['small', (item.source === 'demo-timetable' ? '圖片涵蓋：' : '班期：') + item.classStartDate + '～' + item.classEndDate, 'session-lesson'],
    ['small', item.lesson, 'session-lesson'],
    ['span', editable ? '負責：' + name(item.primaryId) + '　備選：' + name(item.backupId) : '原圖安排・無需指派講師', 'session-instructors'],
    ['span', stateLabels[assignmentState(item)], 'assignment-badge ' + assignmentState(item)],
  ]) {
    const node = document.createElement(tag); node.textContent = text; node.className = className; button.append(node);
  }
  if (editable) button.addEventListener('click', () => openEditor(item, button));
  return button;
}
function bookingCard(event) {
  const card = document.createElement('div');
  card.className = 'schedule-session schedule-booking';
  card.dataset.eventId = event.id;
  const time = document.createElement('small');
  time.className = 'session-time';
  time.textContent = event.start.slice(11, 16) + '–' + event.end.slice(11, 16);
  const title = document.createElement('strong');
  title.className = 'session-title';
  title.textContent = event.title + ' - ' + event.instructorName;
  card.append(time, title);
  return card;
}
function scheduleHeading(date) {
  const heading = document.createElement('tr'); heading.className = 'schedule-day-heading';
  const dateCell = document.createElement('th'); dateCell.scope = 'col'; dateCell.className = 'schedule-date-heading';
  const weekday = new Intl.DateTimeFormat('zh-TW', {weekday: 'long', timeZone: 'Asia/Taipei'}).format(new Date(date + 'T00:00:00+08:00'));
  dateCell.textContent = weekday + ', ' + date.replaceAll('-', '/'); heading.append(dateCell);
  for (const slot of timeSlots) {
    const cell = document.createElement('th'); cell.scope = 'col';
    cell.textContent = slot.start + '–' + slot.end + ' ' + slot.label;
    heading.append(cell);
  }
  return heading;
}
function renderDay(date, daily, visibleIds, bookingCells, bookingState) {
  for (const room of rooms) {
    const row = document.createElement('tr'); row.dataset.date = date;
    const roomCell = document.createElement('th'); roomCell.scope = 'row'; roomCell.className = 'schedule-room'; roomCell.textContent = room.name; row.append(roomCell);
    for (const slot of timeSlots) {
      const scheduled = daily.filter(item => item.room === room.id && item.start < slot.end && item.end > slot.start);
      const shown = scheduled.filter(item => visibleIds.has(item.id));
      const bookings = bookingCells.get(bookingCellKey(room.id, date, slot.id)) ?? [];
      const cell = td('', 'schedule-cell' + (shown.length || bookings.length ? ' scheduled' : scheduled.length ? ' filtered' : ''));
      if (bookings.length) cell.classList.add('booked');
      cell.dataset.resourceId = room.id;
      cell.dataset.timeSlot = slot.id;
      if (shown.length || bookings.length) cell.append(...bookings.map(bookingCard), ...shown.map(sessionButton));
      else {
        const label = document.createElement('span'); label.className = 'schedule-cell-label';
        label.textContent = bookingState === 'error' ? '預約載入失敗' : bookingState !== 'ready' ? '預約資料載入中…' : scheduled.length ? '課堂已被篩選隱藏' : '無排課';
        cell.append(label);
      }
      row.append(cell);
    }
    $('sessions-body').append(row);
  }
}
function render() {
  const lessons = items.filter(item => assignmentState(item) !== 'not-required');
  $('session-total').textContent = lessons.length;
  $('instructor-total').textContent = new Set(items.map(item => item.primaryId).filter(Boolean)).size;
  $('primary-missing').textContent = lessons.filter(item => !item.primaryId).length;
  $('backup-missing').textContent = lessons.filter(item => item.primaryId && !item.backupId).length;
  const isRange = appliedRange !== null;
  const dates = isRange ? scheduleDates(appliedRange.startDate, appliedRange.endDate) : [$('schedule-date').value];
  const queryEnd = addDateDays(dates.at(-1), 1);
  const bookings = bookingStore.getRange(dates[0], queryEnd);
  const bookingCells = indexBookingCells(bookings.events);
  const bookingStatus = $('schedule-bookings-status');
  bookingStatus.textContent = bookings.status === 'ready'
    ? '預約資料已同步：' + bookings.events.length + ' 個上課時段。'
    : bookings.status === 'error' ? bookings.error + ' 請按「重新載入預約」。' : '正在載入預約課表…';
  bookingStatus.className = 'status ' + (bookings.status === 'error' ? 'error' : bookings.status === 'ready' ? 'success' : '');
  bookingStatus.setAttribute('role', bookings.status === 'error' ? 'alert' : 'status');
  $('schedule-bookings-refresh').disabled = bookings.status === 'loading';
  document.querySelector('.schedule-scroll').setAttribute('aria-busy', String(bookings.status === 'loading'));
  const dated = filterSessions(items, {startDate: dates[0], endDate: dates.at(-1)});
  const visible = dated;
  const visibleIds = new Set(visible.map(item => item.id));
  $('session-list-title').textContent = isRange ? '日期區間課表' : '每日課表';
  document.querySelector('.schedule-date-controls').hidden = isRange;
  $('schedule-range-nav').hidden = !isRange;
  document.querySelector('.schedule-table').classList.toggle('schedule-week', isRange);
  $('session-count').textContent = '預約 ' + bookings.events.length + ' 筆 · 示範課堂 ' + visible.length + ' / ' + dated.length + ' 筆';
  if (isRange) $('schedule-range-label').textContent = appliedRange.startDate.replaceAll('-', '/') + ' - ' + appliedRange.endDate.replaceAll('-', '/');
  $('reference-day-note').textContent = isRange ? '' : (referenceNotes[dates[0]] ?? '');
  $('schedule-head').replaceChildren();
  $('sessions-body').replaceChildren();
  for (const date of dates) {
    if (isRange) {
      $('sessions-body').append(scheduleHeading(date));
      if (referenceNotes[date]) {
        const noteRow = document.createElement('tr'); noteRow.className = 'schedule-day-note';
        const cell = td(date + '：' + referenceNotes[date]); cell.colSpan = timeSlots.length + 1;
        noteRow.append(cell); $('sessions-body').append(noteRow);
      }
    } else $('schedule-head').append(scheduleHeading(date));
    const dayState = bookingStore.getRange(date, addDateDays(date, 1)).status;
    renderDay(date, dated.filter(item => item.date === date), visibleIds, bookingCells, dayState);
  }
  $('sessions-empty').hidden = visible.length > 0 || bookings.events.length > 0 || bookings.status !== 'ready';
  $('sessions-empty').textContent = isRange ? '這個日期區間尚無排課，仍顯示所有教室與時段。' : '這一天尚無排課，請切換日期查看其他課堂。';
  if (!$('instructors-view').hidden && bookings.status === 'idle') {
    // 共用狀態會發送 change，載入失敗亦由狀態通知畫面。
    bookingStore.load(dates[0], queryEnd).catch(() => {});
  }
}
bookingStore.addEventListener('change', () => {
  if (!$('instructors-view').hidden) render();
});
$('schedule-bookings-refresh').addEventListener('click', () => {
  const start = appliedRange?.startDate ?? $('schedule-date').value;
  const last = appliedRange?.endDate ?? start;
  bookingStore.load(start, addDateDays(last, 1), {refresh: true}).catch(() => {});
});
for (const id of ['primary-instructor', 'backup-instructor']) {
  $(id).append(option('', '尚未指派'));
  for (const instructor of instructors) $(id).append(option(instructor.id, instructor.name + ' · ' + instructor.specialty));
}
loadAssignments(); render();
$('session-range-form').addEventListener('submit', event => {
  event.preventDefault();
  selectStartDate();
});
function selectStartDate() {
  const input = $('session-start-date');
  if (!input.value || !input.validity.valid) {
    input.value = appliedRange?.startDate ?? $('schedule-date').value;
    return;
  }
  showRange(input.value, addDateDays(input.value, 5));
}
$('session-start-date').addEventListener('change', selectStartDate);
$('session-start-date').addEventListener('click', () => {
  // Open the native calendar when clicking anywhere in the date field.
  try { $('session-start-date').showPicker?.(); } catch { /* Keep the native date control available. */ }
});
$('session-daily').addEventListener('click', () => { appliedRange = null; render(); });
function showRange(startDate, endDate) {
  if (!scheduleDates(startDate, endDate).length) return;
  appliedRange = {startDate, endDate};
  $('session-start-date').value = startDate;
  render();
}
for (const [id, offset] of [['schedule-range-previous', -6], ['schedule-range-next', 6]]) {
  $(id).addEventListener('click', () => {
    if (appliedRange) showRange(addDateDays(appliedRange.startDate, offset), addDateDays(appliedRange.endDate, offset));
  });
}
$('schedule-range-today').addEventListener('click', () => {
  showRange(today, addDateDays(today, 5));
});
let selectedDate = $('schedule-date').value;
$('schedule-date').addEventListener('change', () => {
  if (!$('schedule-date').value || !$('schedule-date').validity.valid) $('schedule-date').value = selectedDate;
  selectedDate = $('schedule-date').value; render();
});
function changeDate(offset) {
  const date = new Date(selectedDate + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + offset);
  selectedDate = date.toISOString().slice(0, 10); $('schedule-date').value = selectedDate; render();
}
$('schedule-previous').addEventListener('click', () => changeDate(-1));
$('schedule-next').addEventListener('click', () => changeDate(1));
$('schedule-today').addEventListener('click', () => { selectedDate = today; $('schedule-date').value = today; render(); });
for (const button of document.querySelectorAll('[data-reference-date]')) {
  button.addEventListener('click', () => {
    appliedRange = null;
    selectedDate = button.dataset.referenceDate; $('schedule-date').value = selectedDate;
    render();
  });
}
$('assignment-cancel').addEventListener('click', () => $('assignment-dialog').close());
$('assignment-dialog').addEventListener('close', () => {
  const nextTrigger = [...document.querySelectorAll('[data-session-id]')].find(button => button.dataset.sessionId === editingId);
  (nextTrigger ?? (trigger?.isConnected ? trigger : $('session-start-date'))).focus();
});
$('assignment-form').addEventListener('submit', event => {
  event.preventDefault();
  const primaryId = $('primary-instructor').value;
  const backupId = $('backup-instructor').value;
  const error = validateAssignment(primaryId, backupId);
  if (error) { $('assignment-error').textContent = error; return; }
  const item = items.find(item => item.id === editingId);
  if (!item) return;
  const assignments = Object.fromEntries(items.map(item => [item.id, {primaryId: item.id === editingId ? primaryId : item.primaryId, backupId: item.id === editingId ? backupId : item.backupId}]));
  try { localStorage.setItem(storageKey, JSON.stringify(assignments)); }
  catch { $('assignment-error').textContent = '瀏覽器無法儲存指派，請確認允許本機儲存後再試。'; return; }
  item.primaryId = primaryId; item.backupId = backupId;
  render(); $('assignment-dialog').close();
  message(item.course + '（' + item.date + ' ' + item.lesson + '）指派已儲存在此瀏覽器。');
});
setupNavigation(document, window, view => {
  if (view === 'instructors') render();
});

import {fetchUtilization} from './api.js';
import {setupNavigation} from './navigation.js';
const root = document.getElementById('utilization-demo');
const $ = id => root.querySelector('[id="' + id + '"]');
setupNavigation(document, window, () => {});
const format = new Intl.NumberFormat('zh-TW', {maximumFractionDigits: 2});
const rate = value => value === null ? '不適用' : format.format(value) + '%';
let controller;
let timeout;

$('start-date').value = '2026-10-01';
$('end-date').value = '2026-10-07';

function status(message, type = '') {
  $('status').textContent = message;
  $('status').className = 'status ' + type;
  $('status').setAttribute('role', type === 'error' ? 'alert' : 'status');
}
function cell(text) {
  const element = document.createElement('td');
  element.textContent = text;
  return element;
}
function render(data, startDate, endDate) {
  const {summary} = data;
  $('range-label').textContent = startDate + ' — ' + endDate;
  $('overall-rate').textContent = rate(summary.utilization);
  $('booked-hours').textContent = format.format(summary.booked_hours) + ' h';
  $('available-hours').textContent = format.format(summary.available_hours) + ' h';
  $('room-count').textContent = format.format(summary.room_count) + ' 間';
  $('open-days').textContent = data.open_days + ' 天';
  $('holiday-count').textContent = data.holidays.length + ' 天';
  $('table-count').textContent = data.rooms.length + ' 間教室';
  $('rooms-body').replaceChildren();
  $('bars').replaceChildren();
  $('holidays').replaceChildren();
  const rooms = [...data.rooms].sort((a, b) => (b.utilization ?? -1) - (a.utilization ?? -1) || a.name.localeCompare(b.name, 'zh-TW'));
  for (const room of rooms) {
    const row = document.createElement('tr');
    row.append(cell(room.name), cell(format.format(room.reservation_count)), cell(format.format(room.booked_hours)), cell(format.format(room.available_hours)), cell(rate(room.utilization)));
    $('rooms-body').append(row);
    const bar = document.createElement('div');
    bar.className = 'bar-row';
    const name = document.createElement('span');
    name.className = 'bar-name'; name.textContent = room.name;
    const track = document.createElement('div'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = (room.utilization ?? 0) + '%'; track.append(fill);
    const value = document.createElement('span'); value.className = 'bar-value'; value.textContent = rate(room.utilization);
    bar.append(name, track, value); $('bars').append(bar);
  }
  $('empty-rooms').hidden = rooms.length > 0;
  if (!rooms.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = '沒有教室資料可供比較。'; $('bars').append(empty);
  }
  for (const holiday of data.holidays) {
    const item = document.createElement('li'); item.textContent = holiday.date + ' · ' + holiday.name; $('holidays').append(item);
  }
  if (!data.holidays.length) {
    const item = document.createElement('li'); item.textContent = '查詢期間沒有排除的展示休館日。'; $('holidays').append(item);
  }
  $('results').hidden = false;
}
$('query-form').addEventListener('submit', async event => {
  event.preventDefault();
  const startDate = $('start-date').value;
  const endDate = $('end-date').value;
  if (!startDate || !endDate || startDate > endDate) {
    status('請選擇有效日期，結束日期須晚於或等於開始日期。', 'error');
    return;
  }
  controller?.abort(); clearTimeout(timeout);
  const current = new AbortController(); controller = current;
  $('results').hidden = true;
  $('query-form').setAttribute('aria-busy', 'true');
  $('submit-button').disabled = true;
  $('submit-button').textContent = '查詢中…';
  status('正在查詢展示預約資料並計算使用率，請稍候。');
  timeout = setTimeout(() => current.abort(), 60000);
  try {
    const data = await fetchUtilization(startDate, endDate, current.signal);
    if (controller !== current) return;
    render(data, startDate, endDate);
    const updatedAt = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei', dateStyle: 'medium', timeStyle: 'medium',
    }).format(new Date(data.updated_at));
    const message = data.is_stale
      ? '資料庫暫時無法使用，目前顯示所選日期與地點的舊快照。'
      : (data.rooms.length ? '查詢完成。以下為所選日期範圍的展示預約使用率。' : '查詢完成，沒有符合條件的教室。');
    status(message + ' 最後更新時間：' + updatedAt + '（台灣時間）。', data.is_stale ? '' : 'success');
  } catch (error) {
    if (controller !== current) return;
    status(error.name === 'AbortError' ? '查詢逾時，請縮小日期範圍或稍後再試。' : error.message, 'error');
  } finally {
    if (controller === current) {
      clearTimeout(timeout);
      $('submit-button').disabled = false;
      $('submit-button').textContent = '查詢使用率 ↗';
      $('query-form').setAttribute('aria-busy', 'false');
    }
  }
});

$('query-form').requestSubmit();

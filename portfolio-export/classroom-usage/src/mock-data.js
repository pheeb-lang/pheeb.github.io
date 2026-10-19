// Entirely fictional, deterministic fixtures. No network, storage or credentials.
const DEMO_ROOMS = ['晨光 101', '晨光 102', '雲杉 201', '雲杉 202', '星河 301', '星河 302', '青禾 401', '青禾 402', '拾光 501', '拾光 502', '晴空 601', '晴空 602', '映月 701', '映月 702', '留白 801', '留白 802'];
const DEMO_PERIODS = [[540, 720], [810, 1050], [1125, 1305]];
const DAY_MS = 86400000;

function parseDemoDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('請選擇有效日期。');
  const value = Date.parse(text + 'T00:00:00Z');
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== text) throw new Error('請選擇有效日期。');
  return value;
}

function mergedMinutes(intervals) {
  let total = 0, left = null, right = null;
  for (const [start, end] of [...intervals].sort((a, b) => a[0] - b[0])) {
    if (right !== null && start <= right) right = Math.max(right, end);
    else {
      if (right !== null) total += right - left;
      [left, right] = [start, end];
    }
  }
  return total + (right === null ? 0 : right - left);
}

function demoHoliday(date) {
  // Fictional recurring closures, deliberately not a real holiday calendar.
  const day = date.getUTCDate();
  if (day === 10) return '學苑休館日（展示）';
  if (day === 24) return '設備維護日（展示）';
  return null;
}

function demoReservations(dayNumber, roomIndex) {
  if (roomIndex === DEMO_ROOMS.length - 1) return []; // Include an unused room.
  const seed = ((dayNumber % 997) + roomIndex * 17) % 19;
  if (seed % 5 === 0) return [];
  const bookings = [];
  if (seed % 4 !== 0) bookings.push([510, 630 + (seed % 3) * 30]);
  if (seed % 3 !== 0) bookings.push([780, 900 + (seed % 4) * 30]);
  if (seed % 2 === 0) bookings.push([870, 990]); // Overlaps the afternoon booking.
  if (seed % 3 === 0) bookings.push([1110, 1230 + (seed % 3) * 30]);
  return bookings;
}

function buildDemoReport(startDate, endDate) {
  const start = parseDemoDate(startDate), end = parseDemoDate(endDate);
  if (start > end || end - start >= 366 * DAY_MS) throw new Error('結束日期須晚於或等於開始日期，範圍最多 366 天。');
  if (startDate < '2000-01-01' || endDate > '2100-12-31') throw new Error('展示日期範圍為 2000 至 2100 年。');
  const holidays = [], openDays = [];
  for (let stamp = start; stamp <= end; stamp += DAY_MS) {
    const date = new Date(stamp), name = demoHoliday(date);
    if (name) holidays.push({date: date.toISOString().slice(0, 10), name});
    else openDays.push(stamp / DAY_MS);
  }
  const available = openDays.length * 10;
  const rooms = DEMO_ROOMS.map((name, index) => {
    let minutes = 0, count = 0;
    for (const day of openDays) {
      const clipped = [];
      for (const [start, end] of demoReservations(day, index)) {
        let valid = false;
        for (const [opening, closing] of DEMO_PERIODS) {
          const left = Math.max(start, opening), right = Math.min(end, closing);
          if (left < right) { clipped.push([left, right]); valid = true; }
        }
        if (valid) count++;
      }
      minutes += mergedMinutes(clipped);
    }
    return {resource_id: 'demo-' + (index + 1), name, reservation_count: count,
      booked_hours: minutes / 60, available_hours: available,
      utilization: available ? minutes / 60 / available * 100 : null};
  });
  const booked = rooms.reduce((total, room) => total + room.booked_hours, 0);
  const totalAvailable = available * rooms.length;
  return {start_date: startDate, end_date: endDate, open_days: openDays.length, holidays, rooms,
    summary: {room_count: rooms.length, booked_hours: booked, available_hours: totalAvailable,
      utilization: totalAvailable ? booked / totalAvailable * 100 : null}};
}

async function fetchUtilization(startDate, endDate, signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return buildDemoReport(startDate, endDate);
}

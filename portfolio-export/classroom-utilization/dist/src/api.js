import {buildReport, parsePeriod} from './utilization.js';
function nonnegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function validateReport(data) {
  if (!data || !Array.isArray(data.rooms) || !Array.isArray(data.holidays) ||
      !data.summary || !Number.isInteger(data.open_days) || data.open_days < 0 ||
      typeof data.updated_at !== 'string' || !Number.isFinite(Date.parse(data.updated_at)) ||
      typeof data.is_stale !== 'boolean') {
    throw new Error('展示資料的統計格式不正確，請確認使用率 資料 的回應格式。');
  }
  const summary = data.summary;
  if (!['booked_hours', 'available_hours', 'room_count'].every(key => nonnegative(summary[key])) ||
      !Number.isInteger(summary.room_count) || summary.room_count !== data.rooms.length) {
    throw new Error('展示資料的使用率摘要不完整。');
  }
  const validRate = value => value === null || (nonnegative(value) && value <= 100);
  if (!validRate(summary.utilization)) throw new Error('展示資料的整棟使用率不正確。');
  const ids = new Set();
  for (const room of data.rooms) {
    if (!room || (typeof room.resource_id !== 'number' && typeof room.resource_id !== 'string') ||
        typeof room.name !== 'string' ||
        !['booked_hours', 'available_hours', 'reservation_count'].every(key => nonnegative(room[key])) ||
        !Number.isInteger(room.reservation_count) || !validRate(room.utilization) ||
        ids.has(String(room.resource_id))) {
      throw new Error('展示資料的教室統計格式不正確。');
    }
    ids.add(String(room.resource_id));
  }
  if (!data.holidays.every(item => item && typeof item.date === 'string' && typeof item.name === 'string')) {
    throw new Error('展示資料的假日資料格式不正確。');
  }
  return data;
}

export async function fetchUtilization(start, end, signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  parsePeriod(start, end);
  return validateReport(buildReport(start, end));
}

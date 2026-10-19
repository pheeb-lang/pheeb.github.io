import {demoBookings} from './mock-bookings.js';
export function validateEvents(data) {
  if (!Array.isArray(data)) throw new Error('課表資料格式不正確。');
  const ids = new Set();
  for (const event of data) {
    if (!event || !['id', 'bookingId', 'title', 'instructorName', 'resource', 'resourceId', 'courseCode', 'courseType', 'start', 'end']
      .every(key => typeof event[key] === 'string' && event[key].length > 0) ||
      !['morning', 'afternoon', 'evening'].includes(event.timeSlot) ||
      !Number.isFinite(Date.parse(event.start)) || !Number.isFinite(Date.parse(event.end)) ||
      Date.parse(event.start) >= Date.parse(event.end) || ids.has(event.id)) {
      throw new Error('課表事件格式不正確。');
    }
    ids.add(event.id);
  }
  return data;
}

// No networking: the existing store consumes the same validated event structure.
export async function fetchEvents(start,end,signal) {
  if (signal?.aborted) throw new DOMException('Aborted','AbortError');
  return validateEvents(demoBookings.filter(event => event.start.slice(0,10)>=start && event.start.slice(0,10)<end).map(event=>({...event})));
}

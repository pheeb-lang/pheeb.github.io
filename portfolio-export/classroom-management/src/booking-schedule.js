import {bookingDate} from './booking-store.js';

export const scheduleSlots = [
  {id: 'morning', start: '09:00', end: '12:00', label: '上午'},
  {id: 'afternoon', start: '13:30', end: '17:30', label: '下午'},
  {id: 'evening', start: '18:30', end: '21:30', label: '晚間'},
];

export function bookingCellKey(roomId, date, slotId) {
  return `${roomId}/${date}/${slotId}`;
}

export function indexBookingCells(events) {
  const cells = new Map();
  for (const event of events) {
    const key = bookingCellKey(event.resourceId, bookingDate(event), event.timeSlot);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(event);
  }
  return cells;
}

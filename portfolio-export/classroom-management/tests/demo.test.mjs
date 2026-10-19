import assert from 'node:assert/strict';
import {sessions, rooms, assignmentState, validateAssignment, filterSessions} from '../src/instructor-data.js';
import {referenceClass} from '../src/reference-timetable.js';
import {demoBookings} from '../src/mock-bookings.js';
import {fetchEvents, validateEvents} from '../src/api.js';
import {createBookingStore} from '../src/booking-store.js';
import {indexBookingCells, bookingCellKey} from '../src/booking-schedule.js';
import {scheduleDates, addDateDays} from '../src/schedule-range.js';

// Tripwire: data loading must never access a real network service.
const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('Unexpected network request'); };
try {
  assert.ok(sessions.length > 0);
  assert.equal(new Set(sessions.map(s => s.id)).size, sessions.length);
  assert.deepEqual(new Set(sessions.map(assignmentState)), new Set(['complete', 'primary-missing', 'backup-missing', 'not-required']));
  for (const s of sessions) {
    assert.ok(rooms.some(r => r.id === s.room));
    assert.equal(validateAssignment(s.primaryId, s.backupId), '');
  }
  assert.ok(validateAssignment('t1', 't1'));
  assert.ok(validateAssignment('unknown', ''));
  assert.equal(validateAssignment('', ''), '');
  assert.equal(scheduleDates('2025-11-04', '2025-11-09').length, 6);
  assert.deepEqual(scheduleDates('2026-02-30', '2026-03-02'), []);
  assert.deepEqual(scheduleDates('2025-11-04', '2025-11-10'), []);
  assert.equal(addDateDays('2025-12-29', 6), '2026-01-04');
  assert.equal(filterSessions(sessions, {startDate:referenceClass.startDate, endDate:addDateDays(referenceClass.startDate, 5)}).length, 10);
  validateEvents(demoBookings);
  assert.deepEqual(new Set(demoBookings.map(e => e.timeSlot)), new Set(['morning', 'afternoon', 'evening']));
  assert.throws(() => validateEvents([{...demoBookings[0], end:demoBookings[0].start}]));
  const store = createBookingStore();
  const notifications = [];
  store.addEventListener('change', () => notifications.push(store.getRange('2025-11-04', '2025-11-10').status));
  await store.load('2025-11-04', '2025-11-10');
  assert.deepEqual(notifications, ['loading', 'ready']);
  assert.equal(store.getRange('2025-11-04', '2025-11-10').events.length, 6);
  assert.deepEqual(store.getRange('2025-11-09', '2025-11-10').events, []);
  await store.load('2025-11-04', '2025-11-10', {refresh:true});
  const events = store.getRange('2025-11-04', '2025-11-10').events;
  const cells = indexBookingCells(events);
  assert.equal(cells.get(bookingCellKey('A201', '2025-11-04', 'morning')).length, 1);
  assert.equal(cells.get(bookingCellKey('online-01', '2025-11-04', 'evening')).length, 1);
  const response = await fetchEvents('2025-11-04', '2025-11-05');
  response[0].title = 'changed copy';
  assert.notEqual((await fetchEvents('2025-11-04', '2025-11-05'))[0].title, 'changed copy');
  assert.deepEqual(await fetchEvents('2030-01-01', '2030-01-02'), []);
  assert.throws(() => store.load('2026-02-30', '2026-03-02'));
  console.log('PASS: fixtures, assignment validation, six-day/date boundaries, local refresh, slot indexing, empty dates, no network.');
} finally {
  globalThis.fetch = originalFetch;
}

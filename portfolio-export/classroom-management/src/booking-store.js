import {fetchEvents, validateEvents} from './api.js';
import {addDateDays} from './schedule-range.js';

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function bookingDate(event) {
  const parts = dateFormat.formatToParts(new Date(event.start));
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key).value).join('-');
}

function rangeDays(start, end) {
  for (const value of [start, end]) {
    const parsed = new Date(value + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value) throw new Error('查詢日期格式不正確。');
  }
  if (start >= end) throw new Error('結束日期必須晚於開始日期。');
  const days = [];
  for (let day = start; day < end; day = addDateDays(day, 1)) days.push(day);
  return days;
}

export function createBookingStore(fetcher = fetchEvents) {
  const store = new EventTarget();
  const byDay = new Map();
  const pending = new Map();
  let revision = 0;
  const notify = () => store.dispatchEvent(new Event('change'));

  store.getRange = (start, end) => {
    const states = rangeDays(start, end).map(day => byDay.get(day) ?? {status: 'idle', events: []});
    const status = ['idle', 'loading', 'error'].find(value => states.some(state => state.status === value)) ?? 'ready';
    return {
      status,
      error: states.find(state => state.status === 'error')?.error ?? null,
      events: states.filter(state => state.status === 'ready').flatMap(state => state.events)
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.resourceId.localeCompare(b.resourceId) || a.id.localeCompare(b.id)),
    };
  };

  store.load = (start, end, {refresh = false} = {}) => {
    const days = rangeDays(start, end);
    const key = start + '/' + end;
    if (pending.has(key)) return pending.get(key);
    if (!refresh && store.getRange(start, end).status === 'ready') {
      return Promise.resolve(store.getRange(start, end).events);
    }
    const requestRevision = ++revision;
    for (const day of days) byDay.set(day, {status: 'loading', events: [], revision: requestRevision});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const request = Promise.resolve().then(async () => {
      try {
        const events = validateEvents(await fetcher(start, end, controller.signal));
        const grouped = new Map(days.map(day => [day, []]));
        for (const event of events) {
          const day = bookingDate(event);
          if (!grouped.has(day)) throw new Error('後端回傳了查詢範圍以外的課堂。');
          grouped.get(day).push(Object.freeze({...event}));
        }
        for (const day of days) {
          if (byDay.get(day)?.revision === requestRevision) {
            byDay.set(day, {status: 'ready', events: grouped.get(day), revision: requestRevision});
          }
        }
        notify();
        return store.getRange(start, end).events;
      } catch (error) {
        const message = error.name === 'AbortError' ? '課表查詢逾時，請稍後再試。' : error.message;
        for (const day of days) {
          if (byDay.get(day)?.revision === requestRevision) {
            byDay.set(day, {status: 'error', events: [], error: message, revision: requestRevision});
          }
        }
        notify();
        throw error;
      } finally {
        clearTimeout(timeout);
        pending.delete(key);
      }
    });
    pending.set(key, request);
    notify();
    return request;
  };
  return store;
}

export const bookingStore = createBookingStore();

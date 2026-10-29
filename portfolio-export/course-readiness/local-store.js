import {sessions, validateAssignment} from './demo-data.js';
export const storageKey = 'portfolio.course-readiness.assignments.v1';
export function createStore(storage) {
  const items = sessions.map(item => ({...item}));
  const store = {items, ready:true, error:'', warning:''};
  let saved = {};
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    for (const item of items) {
      if (!Object.hasOwn(parsed,item.id)) continue;
      const value = parsed[item.id];
      if (!value || validateAssignment(value.primaryId) || typeof value.accepted !== 'boolean' || typeof value.opened !== 'boolean') throw new Error();
      saved[item.id] = {primaryId:value.primaryId, accepted:value.accepted, opened:value.opened};
    }
    for (const item of items) if (saved[item.id]) Object.assign(item,saved[item.id]);
  } catch { saved = {}; store.warning = '無法讀取本機指派，已使用原始展示資料。'; }
  store.load = async () => {
    store.ready = false; store.error = '';
    try {
      // Simulates refreshing the full local occupancy set; no network request.
      await new Promise(resolve => setTimeout(resolve, 120));
      if (!items.length || items.some(item => !item.id || !Number.isFinite(Date.parse(`${item.date}T${item.start}:00+08:00`)))) throw new Error('展示課表載入失敗');
      store.ready = true;
    } catch (reason) { store.error = reason.message; throw reason; }
  };
  store.save = (id, value) => {
    const item = items.find(item => item.id === id);
    if (!item || validateAssignment(value.primaryId)) throw new Error('無效的課堂或講師');
    const next = {...saved, [id]:{primaryId:value.primaryId, accepted:value.accepted === true, opened:value.opened === true}};
    storage.setItem(storageKey, JSON.stringify(next));
    saved = next; Object.assign(item, next[id]);
  };
  return store;
}

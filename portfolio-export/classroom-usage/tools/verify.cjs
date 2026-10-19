// Run with Node.js: node tools/verify.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html'), css = read('src/styles.css');
const context = vm.createContext({DOMException: Error});
vm.runInContext(read('src/mock-data.js'), context);
const evaluate = expression => vm.runInContext(expression, context);
assert.equal(evaluate('mergedMinutes([[540,660],[600,720],[810,870]])'), 240);
for (const [start, end] of [['2026-10-01','2026-10-31'], ['2026-10-10','2026-10-10'], ['2026-10-11','2026-10-11'], ['2028-02-01','2028-02-29'], ['2026-01-01','2026-12-31']]) {
  const report = evaluate(`buildDemoReport('${start}', '${end}')`);
  assert.equal(report.open_days + report.holidays.length, (Date.parse(end)-Date.parse(start))/86400000+1);
  assert.equal(report.summary.booked_hours, report.rooms.reduce((sum, r) => sum+r.booked_hours, 0));
  assert.equal(report.summary.available_hours, report.open_days*10*report.rooms.length);
  for (const room of report.rooms) {
    assert.ok(room.booked_hours <= room.available_hours);
    assert.equal(room.available_hours, report.open_days*10);
    assert.equal(room.utilization, room.available_hours ? room.booked_hours/room.available_hours*100 : null);
  }
  assert.equal(report.summary.utilization, report.summary.available_hours ? report.summary.booked_hours/report.summary.available_hours*100 : null);
  assert.equal(report.rooms.at(-1).booked_hours, 0);
}
for (const expression of ["buildDemoReport('2026-02-30','2026-03-01')", "buildDemoReport('2026-10-20','2026-10-01')", "buildDemoReport('2026-01-01','2027-12-31')"]) assert.throws(() => evaluate(expression));
// Execute the original renderer and submit handler with a minimal DOM harness.
class Element {
  constructor() { this.children = []; this.listeners = {}; this.value = ''; this.style = {}; this.hidden = false; }
  append(...items) { this.children.push(...items); }
  replaceChildren() { this.children = []; }
  setAttribute(key, value) { this[key] = value; }
  addEventListener(key, callback) { this.listeners[key] = callback; }
  requestSubmit() { this.pending = this.listeners.submit({preventDefault(){}}); }
}
const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
context.document = {getElementById: id => {assert.ok(elements.has(id), id); return elements.get(id);}, createElement: () => new Element()};
context.Intl = Intl;
context.AbortController = AbortController;
context.setTimeout = setTimeout;
context.clearTimeout = clearTimeout;
new vm.Script(read('src/main.js'));
vm.runInContext(read('src/main.js'), context);
(async () => {
  const form = elements.get('query-form');
  await form.pending;
  assert.equal(elements.get('results').hidden, false);
  assert.equal(elements.get('bars').children.length, 16);
  const rates = elements.get('bars').children.map(bar => parseFloat(bar.children[2].textContent));
  assert.deepEqual(rates, [...rates].sort((a,b) => b-a));
  assert.equal(elements.get('rooms-body').children.length, 16);
  assert.equal(elements.get('holidays').children.length, 2);
  elements.get('start-date').value = elements.get('end-date').value = '2026-10-10';
  form.requestSubmit(); await form.pending;
  assert.equal(elements.get('overall-rate').textContent, '不適用');
  assert.equal(elements.get('booked-hours').textContent, '0 h');
  elements.get('start-date').value = '2026-10-20';
  form.requestSubmit(); await form.pending;
  assert.equal(elements.get('status').role, 'alert');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(match[1].startsWith('./'));
    assert.ok(fs.existsSync(path.join(root, match[1])));
  }
  const runtime = html+css+read('src/main.js')+read('src/mock-data.js');
  assert.doesNotMatch(runtime, /https?:|\/api\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|Bearer|token|password|url\s*\(|@import/i);
  assert.ok(css.includes('@media(max-width:850px)') && css.includes('@media(max-width:520px)'));
  assert.ok(html.includes('<details><summary>查看排除的假日</summary>'));
  console.log('PASS: calculation, overlap, date boundaries, zero capacity, renderer, sorting, date submit, validation, local resources, network scan and responsive CSS.');
})().catch(error => { console.error(error); process.exitCode = 1; });

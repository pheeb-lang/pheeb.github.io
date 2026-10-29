const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path')
const { JSDOM, VirtualConsole } = require('jsdom'),
  { createServer, prefix } = require('./serve.cjs')
const sandbox = { window: {} }
for (const name of ['data.js', 'core.js'])
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, name), 'utf8'), sandbox)
const D = sandbox.window.KB_DATA,
  C = sandbox.window.KB,
  plain = (x) => JSON.parse(JSON.stringify(x))
let checks = 0
const eq = (a, b) => {
  assert.deepEqual(plain(a), plain(b))
  checks++
}
const ok = (v) => {
  assert.ok(v)
  checks++
}
const logs = [],
  server = createServer(logs),
  errors = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function main() {
  for (const name of ['index.html', 'app.js', 'core.js', 'data.js', 'style.css']) {
    const source = fs.readFileSync(path.join(__dirname, name), 'utf8')
    ok(!/https?:\/\//.test(source))
    ok(!/(?:src|href)=["']\//.test(source))
    ok(!/fetch\(|XMLHttpRequest|axios|WebSocket/.test(source))
    ok(!source.includes('\uFFFD'))
    ok(!/\?\?\?/.test(source))
  }
  eq(C.filter(D.documents, D.folders, C.initial()).length, 22)
  eq(C.status({ is_format_correct: false }), 'draft')
  eq(C.status({}), 'published')
  eq(C.status({ is_format_correct: 0 }), 'published')
  eq(C.type('docx'), 'word')
  eq(C.type('md'), 'markdown')
  for (const folder of ['all', 1, 2, 3, 4])
    for (const status of ['', 'draft', 'published', 'review'])
      for (const type of ['', 'pdf', 'word', 'markdown']) {
        const f = { folder, status, type, query: '文件' },
          got = C.filter(D.documents, D.folders, C.initial(), f)
        const expected = D.documents.filter(
          (d) =>
            !d.is_deleted &&
            (folder === 'all' || d.folder_id === folder) &&
            (!status || (d.is_format_correct === false ? 'draft' : 'published') === status) &&
            (!type || ({ docx: 'word', md: 'markdown' }[d.extension] || d.extension) === type) &&
            (d.title.includes('文件') ||
              D.folders.find((x) => x.id === d.folder_id).name.includes('文件')),
        )
        eq(
          got.map((d) => d.id),
          expected.map((d) => d.id),
        )
      }
  eq(C.filter(D.documents, D.folders, C.initial(), { query: '資料夾 2' }).length, 6)
  eq(C.filter(D.documents, D.folders, { deleted: [1], tags: {} }).length, 21)
  for (const [n, page, expectedPage, count] of [
    [22, 1, 1, 10],
    [22, 2, 2, 10],
    [22, 3, 3, 2],
    [22, 99, 3, 2],
    [10, 2, 1, 10],
    [0, 8, 1, 0],
    [1, -2, 1, 1],
  ]) {
    const p = C.paginate(
      Array.from({ length: n }, (_, i) => i),
      page,
    )
    eq(p.page, expectedPage)
    eq(p.items.length, count)
    ok(p.from <= p.to)
  }
  eq(C.updateTags([1, 6], [6, 2, 2], 'add'), [1, 6, 2])
  eq(C.updateTags([1, 6], [2, 2, 3], 'replace'), [2, 3])
  eq(C.updateTags([1, 6], [1], 'remove'), [6])
  eq(C.updateTags([1], [], 'replace'), [])
  eq(C.load({ getItem: () => '{broken' }, D), C.initial())
  eq(
    C.load(
      {
        getItem: () => JSON.stringify({ deleted: [1, 1, 999], tags: { 1: [2, 2, 999], 999: [1] } }),
      },
      D,
    ),
    { deleted: [1], tags: { 1: [2] } },
  )
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const origin = 'http://127.0.0.1:' + server.address().port
  for (const base of ['/', prefix])
    for (const file of [
      'index.html',
      'style.css',
      'data.js',
      'core.js',
      'app.js',
      'downloads/sample.pdf',
      'downloads/sample.docx',
      'downloads/sample.md',
      'assets/favicon.svg',
    ]) {
      const res = await fetch(origin + base + file)
      eq(res.status, 200)
      ok((await res.arrayBuffer()).byteLength > 0)
    }
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (e) => errors.push(e.message))
  const dom = await JSDOM.fromURL(origin + prefix + 'index.html', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(w) {
      w.HTMLDialogElement.prototype.showModal = function () {
        this.open = true
      }
      w.HTMLDialogElement.prototype.close = function (value) {
        this.returnValue = value
        this.open = false
        this.dispatchEvent(new w.Event('close'))
      }
    },
  })
  await new Promise((r) => dom.window.addEventListener('load', r))
  const w = dom.window,
    d = w.document
  const $ = (s) => d.querySelector(s),
    all = (s) => [...d.querySelectorAll(s)]
  const click = (s) => {
    assert.ok($(s), 'Missing ' + s)
    $(s).click()
  }
  const input = (s, value, event = 'input') => {
    const el = $(s)
    el.value = value
    el.dispatchEvent(new w.Event(event, { bubbles: true }))
  }
  const confirm = async (value) => {
    $('#confirm').close(value)
    await sleep(0)
  }
  const stored = () => JSON.parse(w.localStorage.getItem(C.KEY))
  eq(all('[data-document]').length, 10)
  eq($('.stat strong').textContent, '22')
  click('[data-action=next]')
  eq(all('[data-document]').length, 10)
  click('[data-action=next]')
  eq(all('[data-document]').length, 2)
  ok($('[data-action=next]').disabled)
  input('#search', '不存在')
  eq(all('[data-document]').length, 0)
  ok($('#results').textContent.includes('沒有符合'))
  click('[data-action=clear-filters]')
  click('[data-folder="2"]')
  input('#status', 'published', 'change')
  input('#type', 'word', 'change')
  ok(all('[data-document]').length > 0)
  click('[data-action=clear-filters]')
  click('[data-action=grid]')
  eq(all('.doc-card').length, 10)
  click('[data-action=list]')
  input('#list-scenario', 'empty', 'change')
  eq(all('[data-document]').length, 0)
  click('[data-action=clear-filters]')
  click('[data-action=delete]')
  await confirm('cancel')
  eq($('.stat strong').textContent, '22')
  input('#delete-scenario', 'error', 'change')
  click('[data-action=delete]')
  await confirm('ok')
  eq($('.stat strong').textContent, '22')
  ok($('#message').textContent.includes('刪除失敗'))
  input('#delete-scenario', 'normal', 'change')
  click('[data-action=delete]')
  await confirm('ok')
  eq($('.stat strong').textContent, '21')
  eq(stored().deleted, [1])
  w.location.hash = '#tags/2'
  await sleep(10)
  ok($('#tag-query'))
  click('[data-action=choose-tag][data-id="3"]')
  eq(stored().tags[2], [2, 3])
  ok($('[data-action=choose-tag][data-id="3"]').disabled)
  input('#tag-query', '安全')
  eq(all('[data-action=choose-tag]').length, 1)
  input('#tag-query', '')
  click('[data-mode=batch]')
  click('[data-action=choose-tag][data-id="4"]')
  click('[data-action=choose-tag][data-id="5"]')
  click('[data-action=submit-tags]')
  eq(stored().tags[2], [2, 3, 4, 5])
  click('[data-mode=replace]')
  click('[data-action=choose-tag][data-id="6"]')
  click('[data-action=submit-tags]')
  eq(stored().tags[2], [6])
  click('[data-action=remove-tag][data-id="6"]')
  eq(stored().tags[2], [])
  click('[data-mode=single]')
  click('[data-action=choose-tag][data-id="7"]')
  click('[data-action=clear-tags]')
  await confirm('cancel')
  eq(stored().tags[2], [7])
  click('[data-action=clear-tags]')
  await confirm('ok')
  eq(stored().tags[2], [])
  w.localStorage.setItem('unrelated.test', 'preserve')
  const saved = w.localStorage.getItem(C.KEY),
    fresh = await JSDOM.fromURL(origin + prefix + 'index.html', {
      runScripts: 'dangerously',
      resources: 'usable',
      virtualConsole,
      beforeParse(w2) {
        w2.localStorage.setItem(C.KEY, saved)
      },
    })
  await new Promise((r) => fresh.window.addEventListener('load', r))
  eq(fresh.window.document.querySelector('.stat strong').textContent, '21')
  eq(JSON.parse(fresh.window.localStorage.getItem(C.KEY)).tags[2], [])
  fresh.window.close()
  w.location.hash = '#documents'
  await sleep(10)
  input('#question', '   ')
  ok($('#ask').disabled)
  $('#ask-form').dispatchEvent(new w.Event('submit', { cancelable: true }))
  ok(!$('#question').disabled)
  input('#question', '標籤如何管理？')
  click('#ask')
  ok($('#ask').disabled)
  ok($('#question').disabled)
  $('#ask-form').dispatchEvent(new w.Event('submit', { cancelable: true }))
  await sleep(800)
  ok($('.answer'))
  eq(all('.source').length, 2)
  ok($('#source-list').hidden)
  ok(!$('#sources-toggle').checked)
  click('#sources-toggle')
  ok(!$('#source-list').hidden)
  ok($('.source').textContent.includes('Chunk #'))
  ok($('.source').textContent.includes('92.6%'))
  click('#ask')
  await sleep(800)
  ok($('#source-list').hidden)
  ok(!$('#sources-toggle').checked)
  for (const scenario of ['empty', 'no-sources', 'error', 'timeout']) {
    input('#rag-scenario', scenario, 'change')
    click('#ask')
    await sleep(scenario === 'timeout' ? 1500 : 800)
    ok(!$('#ask').disabled)
    eq(all('.source').length, 0)
    if (['error', 'timeout'].includes(scenario)) ok($('.error'))
    else ok($('.answer'))
    if (scenario === 'empty') ok($('.answer').textContent.includes('足夠'))
  }
  click('#reset')
  await confirm('cancel')
  ok(w.localStorage.getItem(C.KEY))
  click('#reset')
  await confirm('ok')
  eq(w.localStorage.getItem(C.KEY), null)
  eq(w.localStorage.getItem('unrelated.test'), 'preserve')
  eq($('.stat strong').textContent, '22')
  eq(all('.source').length, 0)
  ok($('#ask').disabled)
  eq(errors, [])
  ok(logs.every((x) => x.status === 200))
  dom.window.close()
  console.log(
    JSON.stringify(
      {
        checks,
        errors,
        httpRequests: logs.length,
        status: 'PASS',
        note: 'DOM dialog methods polyfilled; native keyboard and layout require browser review.',
      },
      null,
      2,
    ),
  )
}
main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => server.close())

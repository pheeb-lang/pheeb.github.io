import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { once } from 'node:events'
import vm from 'node:vm'
import { JSDOM } from 'jsdom'
import * as core from './core.js'
import { createDemoService, STORAGE_KEY, SCENARIOS } from './service.js'
import { mountDemo } from './app.js'
const require = createRequire(import.meta.url)
const { createServer, prefix } = require('./serve.cjs')
const root = new URL('./', import.meta.url)
let checks = 0
function check(name, fn) {
  fn()
  checks++
  console.log('PASS ' + name)
}
const file = (name = 'demo.csv') => new File(['dummy content'], name)
const fixture = (id) => JSON.parse(fs.readFileSync(new URL('fixtures/' + id + '.json', root)))
check('normalization: labels/values, x/y, categories, map, item aliases, datasets', () => {
  for (const source of [
    { labels: ['A'], values: [2] },
    { x: ['A'], y: [2] },
    { categories: ['A'], values: [2] },
    { A: 2 },
    { data: [{ month: 'A', count: 2 }] },
    { data: [{ date: 'A', total: 2 }] },
    { data: [{ name: 'A', value: 2 }] },
  ]) {
    const data = core.normalizeChartData(source, 'bar')
    assert.deepEqual(data.labels, ['A'])
    assert.deepEqual(data.datasets[0].data, [2])
  }
  const data = { labels: ['A'], datasets: [{ data: [2] }] }
  assert.equal(core.normalizeChartData(data, 'pie'), data)
  assert.deepEqual(core.normalizeChartSources(null), [])
  assert.deepEqual(
    core.normalizeChartSources([{ data: [] }, { data: [{ label: 'A', value: 0 }] }]).length,
    1,
  )
  assert.equal(core.hasChartData({ datasets: [{ data: [] }] }), false)
})
check('alignment: union order, zero fill, duplicate last wins, falsy labels filtered', () => {
  const aligned = core.buildMultiCategoryChartData([
    {
      column: 'one',
      data: [
        { label: 'A', value: 1 },
        { label: 'B', value: 2 },
        { label: 'A', value: 3 },
      ],
    },
    {
      column: 'two',
      data: [
        { label: 'B', value: 4 },
        { label: 'C', value: 5 },
        { label: '', value: 7 },
      ],
    },
  ])
  assert.deepEqual(aligned.labels, ['A', 'B', 'C'])
  assert.deepEqual(
    aligned.datasets.map((d) => d.data),
    [
      [3, 2, 0],
      [0, 4, 5],
    ],
  )
  assert.equal(core.buildMultiCategoryChartData([]), null)
})
check('missing aliases, precedence, objects, formatting and zero preservation', () => {
  for (const key of [
    'missing_value_count',
    'missing_values_count',
    'missing_count',
    'null_count',
    'missing_values',
  ])
    assert.equal(core.getMissingValueCount({ [key]: 3 }), 3)
  assert.equal(core.getMissingValueCount({ missing_value_count: 0, missing_values: 8 }), 0)
  assert.equal(core.getMissingValueCount({ missing_values: { a: 2, b: '1', c: null } }), 3)
  assert.equal(core.formatNumber(null), '0')
  assert.equal(core.formatCell(0), 0)
  assert.equal(core.formatCell(''), '-')
  assert.equal(core.formatFileSize(1024), '1.0 KB')
})
for (const id of SCENARIOS)
  check('CSV/fixture consistency: ' + id, () => {
    const f = fixture(id),
      r = f.result,
      rows = r.preview_data,
      columns = Object.keys(rows[0])
    const csv = fs
      .readFileSync(new URL('samples/' + id + '.csv', root), 'utf8')
      .replace(/^\uFEFF/, '')
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(','))
    assert.deepEqual(csv[0], columns)
    assert.equal(csv.length - 1, r.summary.row_count)
    assert.equal(columns.length, r.summary.column_count)
    assert.equal(
      core.getMissingValueCount(r.summary),
      rows.flatMap(Object.values).filter((v) => v == null || v === '').length,
    )
    assert.deepEqual(
      csv.slice(1),
      rows.map((row) => columns.map((c) => String(row[c] ?? ''))),
    )
    for (const source of r.charts.bar) {
      const expected = {}
      for (const row of rows)
        if (row[source.column] != null && row[source.column] !== '')
          expected[row[source.column]] = (expected[row[source.column]] || 0) + 1
      assert.deepEqual(Object.fromEntries(source.data.map((d) => [d.label, d.value])), expected)
    }
    assert.deepEqual(r.charts.bar, r.charts.pie)
    if (r.statistics.numeric) {
      const stat = r.statistics.numeric,
        vals = rows.map((r) => r[stat.column]).filter((v) => typeof v === 'number')
      assert.equal(
        stat.sum,
        vals.reduce((a, b) => a + b, 0),
      )
      assert.equal(stat.mean, stat.sum / vals.length)
    }
  })
const logs = [],
  server = createServer(logs)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const origin = 'http://127.0.0.1:' + server.address().port
try {
  for (const base of ['/', prefix]) {
    for (const path of [
      'index.html',
      'style.css',
      'app.js',
      'core.js',
      'service.js',
      'favicon.svg',
      'vendor/chart.umd.js',
      'vendor/chart.umd.js.map',
      ...SCENARIOS.flatMap((id) => ['fixtures/' + id + '.json', 'samples/' + id + '.csv']),
    ]) {
      const response = await fetch(origin + base + path)
      assert.equal(response.status, 200, base + path)
      await response.arrayBuffer()
    }
    checks++
    console.log('PASS HTTP static resources at ' + base)
  }

  for (const base of ['/', prefix]) {
    for (const path of [
      'README.md',
      'SOURCE-MAP.md',
      'vendor/Chart.js-LICENSE.md',
      'vendor/kurkle-color-LICENSE.md',
      'vendor/NOTICE.md',
    ]) {
      const response = await fetch(origin + base + path)
      assert.equal(response.status, 200)
      await response.text()
    }
  }
  checks++
  console.log('PASS HTTP documentation and local dependency licenses')

  const requests = []
  const fetcher = async (path) => {
    requests.push(path)
    return fetch(new URL(path, origin + prefix))
  }
  const dom = new JSDOM(fs.readFileSync(new URL('index.html', root), 'utf8'), {
    url: origin + prefix,
  })
  const doc = dom.window.document,
    $ = (id) => doc.getElementById(id)
  let release
  const service = createDemoService({
    fetcher,
    storage: () => dom.window.localStorage,
    delay: () =>
      new Promise((resolve) => {
        release = resolve
      }),
  })
  class ChartSpy {
    constructor(canvas, config) {
      this.canvas = canvas
      this.config = config
      this.destroyed = false
    }
    destroy() {
      this.destroyed = true
    }
  }
  const app = mountDemo(doc, service, ChartSpy)
  const change = () => new dom.window.Event('change', { bubbles: true })
  const choose = (id) => {
    $('scenario').value = id
    $('scenario').dispatchEvent(change())
  }
  const mode = (value) => {
    const el = doc.querySelector('[value="' + value + '"]')
    el.checked = true
    el.dispatchEvent(change())
  }
  const analyze = async () => {
    const pending = app.analyze()
    assert.equal($('analyze').disabled, true)
    assert.equal($('clear').disabled, true)
    release()
    await pending
  }
  check('no file cannot analyze', () => assert.equal($('analyze').disabled, true))
  await app.analyze()
  assert.equal(requests.length, 0)
  app.setFile(file('bad.txt'))
  check('illegal extension: error, disabled analysis', () => {
    assert.equal($('error').hidden, false)
    assert.equal($('analyze').disabled, true)
  })
  for (const name of ['arbitrary.CSV', 'arbitrary.XLSX', 'arbitrary.xls']) {
    app.setFile(file(name))
    assert.equal($('analyze').disabled, false)
    assert.match($('file-status').textContent, /未解析檔案內容/)
  }
  // Actual change and drop event wiring, not only the exported helpers.
  Object.defineProperty($('file'), 'files', { value: [file('event.csv')], configurable: true })
  $('file').dispatchEvent(change())
  assert.match($('file-status').textContent, /event.csv/)
  const drop = new dom.window.Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', { value: { files: [file('dropped.csv')] } })
  $('drop-zone').dispatchEvent(drop)
  assert.match($('file-status').textContent, /dropped.csv/)
  checks++
  console.log('PASS file input, drag/drop, CSV/XLSX/XLS format validation and explicit disclosure')
  choose('multi')
  app.setFile(file())
  const pending = app.analyze()
  check('loading locks controls and ignores replacement/reset', () => {
    assert.equal($('scenario').disabled, true)
    assert.equal($('file').disabled, true)
    assert.equal($('chart-modes').disabled, true)
    app.setFile(file('ignored.csv'))
    app.reset()
    assert.match($('file-status').textContent, /demo.csv/)
  })
  release()
  await pending
  check('success statistics, preview and summary field_count fallback', () => {
    assert.equal($('results').hidden, false)
    assert.deepEqual(
      [...doc.querySelectorAll('.stat-value')].map((n) => n.textContent),
      ['4', '3', '3', '0'],
    )
    assert.equal(doc.querySelectorAll('#preview tbody tr').length, 4)
  })
  const before = requests.length
  for (const value of ['stacked_bar', 'grouped_bar', 'pie', 'bar']) {
    const old = [...app.charts]
    mode(value)
    assert.ok(old.every((c) => c.destroyed))
    assert.equal(requests.length, before)
    if (['stacked_bar', 'grouped_bar'].includes(value)) {
      assert.equal(app.charts.length, 1)
      assert.deepEqual(app.charts[0].config.data.labels, [
        '文件',
        '報表',
        '手冊',
        '待處理',
        '已完成',
      ])
      assert.deepEqual(
        app.charts[0].config.data.datasets.map((d) => d.data),
        [
          [2, 1, 1, 0, 0],
          [1, 0, 0, 1, 2],
        ],
      )
      assert.equal(app.charts[0].config.options.scales.x.stacked, value === 'stacked_bar')
    } else assert.equal(app.charts[0].config.type, value)
  }
  checks++
  console.log(
    'PASS four modes, exact multi-category alignment, stacked axes, no extra requests and chart disposal',
  )
  dom.window.localStorage.setItem('other-demo', 'keep')
  const savePending = app.save()
  assert.equal($('save').disabled, true)
  assert.equal($('clear').disabled, true)
  release()
  await savePending
  check('local save payload, chunks, success and namespace isolation', () => {
    const record = service.readRecords()[0]
    assert.deepEqual(Object.keys(record.payload), [
      'source_file',
      'summary',
      'statistics',
      'charts',
      'preview_data',
    ])
    assert.equal(record.chunks.join(''), JSON.stringify(record.payload))
    assert.equal(record.chunks_count, record.chunks.length)
    assert.equal($('save-success').hidden, false)
    assert.equal(dom.window.localStorage.getItem('other-demo'), 'keep')
  })

  const loadedFile = await service.sample('normal')
  assert.equal(loadedFile.name, 'normal.csv')
  assert.match(await loadedFile.text(), /類別,件數/)
  checks++
  console.log('PASS sample CSV fetched locally and created as selectable File')

  const reloaded = mountDemo(
    new JSDOM(fs.readFileSync(new URL('index.html', root), 'utf8')).window.document,
    service,
    ChartSpy,
  )
  assert.equal(service.readRecords().length, 1)
  reloaded.destroyCharts()
  checks++
  console.log('PASS persistence through new mount using same storage')
  choose('missing')
  app.setFile(file())
  await analyze()
  check('missing values cards, dash cells, empty handling', () => {
    assert.equal(doc.querySelectorAll('.stat-value')[3].textContent, '3')
    assert.equal(
      [...doc.querySelectorAll('#preview td')].filter((td) => td.textContent === '-').length,
      3,
    )
  })
  choose('empty')
  app.setFile(file())
  await analyze()
  check('no charts, still statistics and preview', () => {
    assert.equal(app.charts.length, 0)
    assert.match($('charts').textContent, /沒有可用/)
    assert.equal(doc.querySelectorAll('#preview tbody tr').length, 2)
  })
  choose('analysis-failure')
  app.setFile(file())
  await analyze()
  check('analysis failure: visible error and controls restored', () => {
    assert.equal($('error').hidden, false)
    assert.equal($('results').hidden, true)
    assert.equal($('analyze').disabled, false)
  })
  choose('save-failure')
  app.setFile(file())
  await analyze()
  const failedSave = app.save()
  release()
  await failedSave
  check('save failure: no write, error and retry enabled', () => {
    assert.equal(service.readRecords().length, 1)
    assert.equal($('save-error').hidden, false)
    assert.equal($('save').disabled, false)
  })
  choose('normal')
  app.setFile(file())
  await analyze()
  const old = [...app.charts]
  $('clear').click()
  check('clear disposes charts and clears file/result/errors/save messages; reanalysis', () => {
    assert.ok(old.every((c) => c.destroyed))
    assert.equal($('results').hidden, true)
    assert.equal(app.result, undefined)
    assert.equal($('analyze').disabled, true)
    for (const id of ['error', 'save-success', 'save-error', 'status'])
      assert.equal($(id).hidden, true)
  })
  app.setFile(file())
  await analyze()
  assert.equal($('results').hidden, false)
  $('reset-storage').click()
  check('reset only feature namespace', () => {
    assert.equal(dom.window.localStorage.getItem(STORAGE_KEY), null)
    assert.equal(dom.window.localStorage.getItem('other-demo'), 'keep')
  })
  const broken = createDemoService({
    storage: () => ({
      getItem() {
        throw new Error('denied')
      },
    }),
    delay: async () => {},
  })
  await assert.rejects(broken.save({}), /本地儲存失敗/)
  checks++
  console.log('PASS real storage access failure')
  const quota = createDemoService({
    storage: () => ({
      getItem() {
        return '[]'
      },
      setItem() {
        throw new Error('quota')
      },
    }),
    delay: async () => {},
  })
  await assert.rejects(quota.save({}), /quota/)
  checks++
  console.log('PASS storage quota failure')
  const unavailable = createDemoService({
    fetcher: async () => ({ ok: false }),
    delay: async () => {},
  })
  await assert.rejects(unavailable.analyze(file(), 'bar', 'normal'), /資源載入失敗/)
  checks++
  console.log('PASS missing fixture failure')
  const html = fs.readFileSync(new URL('index.html', root), 'utf8')
  const runtime = ['index.html', 'app.js', 'core.js', 'service.js', 'style.css']
    .map((p) => fs.readFileSync(new URL(p, root), 'utf8'))
    .join('\n')
  check(
    'static scan: no backend URL, remote runtime URL, root absolute resources, unsafe DOM insertion',
    () => {
      assert.ok(!/https?:\/\/|localhost:8000|\/api\/|innerHTML|eval\(/.test(runtime))
      assert.ok(!/(?:href|src)=["']\//.test(html))
      assert.ok(!/url\(\s*https?:|@import/.test(runtime))
      assert.ok(!requests.some((r) => !r.startsWith('./')))
      assert.ok(!logs.some((r) => r.status !== 200))
      assert.ok(!html.includes('????'))
    },
  )
  const context = {}
  vm.runInNewContext(fs.readFileSync(new URL('vendor/chart.umd.js', root), 'utf8'), context)
  const chart = context.Chart
  check('real local Chart.js UMD loads and registers bar/pie controllers', () => {
    assert.equal(chart.version, '4.5.1')
    assert.ok(chart.registry.getController('bar'))
    assert.ok(chart.registry.getController('pie'))
  })
  app.destroyCharts()
  dom.window.close()
  console.log(
    'TOTAL ' +
      checks +
      ' checks passed. Chart rendering in this suite uses a spy, not a canvas engine.',
  )
} finally {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}

import {
  normalizeChartSources,
  buildMultiCategoryChartData,
  normalizeChartData,
  hasChartData,
  getMissingValueCount,
  formatNumber,
  formatFileSize,
  formatCell,
} from './core.js'
import { createDemoService } from './service.js'

const modeNames = {
  bar: '一般長條圖',
  stacked_bar: '堆疊長條圖',
  grouped_bar: '群組長條圖',
  pie: '圓餅圖',
}
const notes = {
  normal: '虛構文件類別次數；統計與預覽使用同一份範例。',
  multi: '兩個分類欄位有部分共用標籤；堆疊／群組取標籤聯集並補零。',
  missing: '4 列、3 欄、3 個缺失值；類別計數排除空值，預覽以 - 顯示。',
  empty: '2 列、2 欄，保留統計及預覽，刻意不提供 charts。',
  'analysis-failure': '按下分析後顯示模擬錯誤，可切換情境重試。',
  'save-failure': '分析成功，但加入 RAG 時模擬失敗，不寫入本地紀錄。',
}

export function mountDemo(doc, service, ChartClass) {
  const $ = (id) => doc.getElementById(id)
  let selectedFile = null,
    fixture = null,
    loading = false,
    saving = false,
    charts = []
  let mode = 'bar'
  const busy = () => loading || saving
  function message(id, text = '') {
    $(id).textContent = text
    $(id).hidden = !text
  }
  function element(tag, text, className) {
    const el = doc.createElement(tag)
    if (text !== undefined) el.textContent = text
    if (className) el.className = className
    return el
  }
  function destroyCharts() {
    charts.forEach((chart) => chart.destroy())
    charts = []
  }
  function controls() {
    $('analyze').disabled = busy() || !selectedFile
    $('analyze').textContent = loading ? '分析中…' : '開始模擬分析'
    for (const id of ['clear', 'file', 'scenario', 'load-sample', 'reset-storage', 'chart-modes']) {
      $(id).disabled = busy()
    }
    $('save').disabled = busy() || !fixture
    $('save').textContent = saving ? '加入中…' : '加入 RAG 知識庫'
    $('drop-zone').setAttribute('aria-busy', String(loading))
    $('results').setAttribute('aria-busy', String(saving))
    $('download').setAttribute('aria-disabled', String(busy()))
  }
  function clearResult() {
    fixture = null
    destroyCharts()
    $('results').hidden = true
    for (const id of ['error', 'status', 'save-success', 'save-error']) message(id)
    for (const id of ['charts', 'stats', 'preview', 'statistics']) $(id).replaceChildren()
  }
  function reset() {
    if (busy()) return
    clearResult()
    selectedFile = null
    $('file').value = ''
    $('file-status').textContent = '尚未選取檔案'
    $('drop-zone').classList.remove('dragging')
    controls()
  }
  function setFile(file) {
    if (busy() || !file) return
    clearResult()
    $('file').value = ''
    selectedFile = null
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(extension)) {
      message('error', '檔案格式不支援，請上傳 .xlsx、.xls 或 .csv。')
      $('file-status').textContent = '尚未選取檔案'
    } else {
      selectedFile = file
      const label = $('scenario').selectedOptions[0].textContent
      $('file-status').textContent =
        file.name +
        ' · ' +
        formatFileSize(file.size) +
        '；未解析檔案內容，將呈現「' +
        label +
        '」預設範例結果。'
    }
    controls()
  }
  function renderCharts() {
    destroyCharts()
    $('charts').replaceChildren()
    if (!fixture) return
    const type = mode === 'pie' ? 'pie' : 'bar'
    const sources = normalizeChartSources(fixture.result.charts?.[type])
    let configs = sources
    if (['stacked_bar', 'grouped_bar'].includes(mode)) {
      const data = buildMultiCategoryChartData(sources)
      configs = hasChartData(data) ? [data] : []
    }
    if (!configs.length) {
      $('charts').append(
        element('p', '此情境沒有可用圖表資料；仍可檢視統計與資料預覽。', 'card muted'),
      )
    }
    configs.forEach((source, i) => {
      const card = element('article', undefined, 'card chart-card')
      const title = source.title || modeNames[mode] + ' ' + (i + 1)
      card.append(
        element('h2', title),
        element('p', modeNames[mode] + ' · 本地 charts.' + type, 'muted'),
      )
      const box = element('div', undefined, 'chart-box')
      const canvas = element('canvas')
      canvas.setAttribute('role', 'img')
      canvas.setAttribute('aria-label', title + '；數值可在下方圖表資料檢視')
      box.append(canvas)
      card.append(box)
      const data = normalizeChartData(source, type)
      const details = element('details')
      details.append(element('summary', '圖表資料（文字）'))
      details.append(
        element(
          'pre',
          JSON.stringify(
            {
              labels: data.labels,
              datasets: data.datasets.map(({ label, data }) => ({ label, data })),
            },
            null,
            2,
          ),
        ),
      )
      card.append(details)
      $('charts').append(card)
      if (!ChartClass) {
        card.append(
          element('p', '圖表依賴未載入，請確認 vendor/chart.umd.js；可使用文字資料檢視。', 'error'),
        )
        return
      }
      charts.push(
        new ChartClass(canvas, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: type === 'pie' || data.datasets.length > 1, position: 'bottom' },
              tooltip: { mode: 'index', intersect: false },
            },
            scales:
              type === 'pie'
                ? {}
                : {
                    x: { stacked: mode === 'stacked_bar' },
                    y: {
                      beginAtZero: true,
                      stacked: mode === 'stacked_bar',
                      ticks: { precision: 0 },
                    },
                  },
          },
        }),
      )
    })
    message(
      'status',
      '目前圖表類型：' + modeNames[mode] + '。使用同一份本地結果立即重繪，未重新分析。',
    )
  }
  function renderResults() {
    const result = fixture.result
    const summary = result.summary ?? result ?? {}
    const stats = [
      ['總列數', summary.row_count],
      ['總欄數', summary.column_count],
      ['欄位數量', summary.field_count ?? summary.column_count],
      ['缺失值數量', getMissingValueCount(summary)],
    ]
    $('stats').replaceChildren()
    for (const [label, value] of stats) {
      const card = element('div', undefined, 'card')
      card.append(element('p', label, 'muted'), element('p', formatNumber(value), 'stat-value'))
      $('stats').append(card)
    }
    $('preview').replaceChildren()
    const rows = Array.isArray(result.preview_data) ? result.preview_data : []
    const columns = rows.length ? Object.keys(rows[0]) : []
    if (rows.length) {
      const table = element('table'),
        head = element('thead'),
        tr = element('tr')
      for (const column of columns) {
        const th = element('th', column)
        th.scope = 'col'
        tr.append(th)
      }
      head.append(tr)
      const body = element('tbody')
      for (const row of rows) {
        const tr = element('tr')
        for (const column of columns) {
          const td = element('td', formatCell(row[column]))
          td.title = String(row[column] ?? '')
          tr.append(td)
        }
        body.append(tr)
      }
      table.append(head, body)
      $('preview').append(table)
    } else $('preview').append(element('p', '沒有資料預覽。', 'muted'))
    $('statistics').textContent = JSON.stringify(result.statistics ?? {}, null, 2)
    $('results').hidden = false
    renderCharts()
  }
  async function analyze() {
    if (!selectedFile || busy()) return
    clearResult()
    loading = true
    controls()
    try {
      fixture = await service.analyze(selectedFile, mode, $('scenario').value)
      renderResults()
    } catch (error) {
      clearResult()
      message('error', error.message || '資料分析失敗，請稍後再試。')
    } finally {
      loading = false
      controls()
    }
  }
  function refreshRecords() {
    try {
      const records = service.readRecords()
      $('records').textContent =
        '已保存 ' +
        formatNumber(records.length) +
        ' 筆本地紀錄。' +
        (records.length ? ' 最近來源：' + records.at(-1).payload.source_file : '')
    } catch (error) {
      $('records').textContent = '無法讀取本地紀錄：' + error.message
    }
  }
  async function save() {
    if (!fixture || !selectedFile || busy()) return
    saving = true
    controls()
    message('save-success')
    message('save-error')
    const result = fixture.result
    const payload = {
      source_file: selectedFile.name,
      summary: result.summary ?? result,
      statistics: result.statistics,
      charts: result.charts,
      preview_data: result.preview_data,
    }
    try {
      const response = await service.save(payload, fixture.save_error)
      message(
        'save-success',
        '本地模擬儲存成功，共 ' +
          formatNumber(response.chunks_count) +
          ' 個模擬 chunks（每段最多 500 字元）。未建立向量索引。',
      )
      refreshRecords()
    } catch (error) {
      message('save-error', error.message || '加入 RAG 知識庫失敗。')
    } finally {
      saving = false
      controls()
    }
  }
  $('file').addEventListener('change', (event) => setFile(event.target.files?.[0]))
  $('drop-zone').addEventListener('dragover', (event) => {
    event.preventDefault()
    if (!busy()) $('drop-zone').classList.add('dragging')
  })
  $('drop-zone').addEventListener('dragleave', () => $('drop-zone').classList.remove('dragging'))
  $('drop-zone').addEventListener('drop', (event) => {
    event.preventDefault()
    $('drop-zone').classList.remove('dragging')
    setFile(event.dataTransfer?.files?.[0])
  })
  $('clear').addEventListener('click', reset)
  $('analyze').addEventListener('click', analyze)
  $('save').addEventListener('click', save)
  $('scenario').addEventListener('change', () => {
    if (busy()) return
    reset()
    const id = $('scenario').value
    $('download').href = './samples/' + id + '.csv'
    $('scenario-note').textContent = $('scenario').selectedOptions[0].textContent + '：' + notes[id]
  })
  $('load-sample').addEventListener('click', async () => {
    if (busy()) return
    loading = true
    controls()
    message('error')
    try {
      const file = await service.sample($('scenario').value)
      loading = false
      setFile(file)
    } catch (error) {
      message('error', error.message)
    } finally {
      loading = false
      controls()
    }
  })
  $('download').addEventListener('click', (event) => {
    if (busy()) event.preventDefault()
  })
  for (const input of doc.querySelectorAll('[name=chartType]')) {
    input.addEventListener('change', () => {
      if (busy()) return
      mode = input.value
      renderCharts()
    })
  }
  $('reset-storage').addEventListener('click', () => {
    if (busy()) return
    try {
      service.reset()
      message('save-success')
      message('save-error')
      $('storage-status').textContent = '已重設本展示紀錄。'
      refreshRecords()
    } catch (error) {
      $('storage-status').textContent = '重設失敗：' + error.message
    }
  })
  doc.defaultView?.addEventListener('pagehide', destroyCharts)
  refreshRecords()
  controls()
  return {
    reset,
    setFile,
    analyze,
    save,
    destroyCharts,
    get charts() {
      return charts
    },
    get result() {
      return fixture?.result
    },
  }
}
if (typeof document !== 'undefined') {
  mountDemo(document, createDemoService(), globalThis.Chart)
}

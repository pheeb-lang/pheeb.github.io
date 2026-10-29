;(function () {
  'use strict'
  const D = window.KB_DATA,
    C = window.KB,
    $ = (id) => document.getElementById(id)
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    )
  let storage
  try {
    storage = window.localStorage
  } catch {
    storage = null
  }
  let state = C.load(storage, D),
    filters = { query: '', folder: 'all', status: '', type: '' },
    page = 1,
    mode = 'list'
  let selected = null,
    addMode = 'single',
    batch = [],
    docQuery = '',
    tagQuery = ''
  let rag = { question: '', answer: '', sources: [], error: '', busy: false, open: false },
    generation = 0,
    timer
  const active = () => C.filter(D.documents, D.folders, state)
  const docTags = (id) => state.tags[id] ?? D.documents.find((d) => d.id === id)?.tag_ids ?? []
  const folderName = (id) => D.folders.find((f) => f.id === id)?.name || '根目錄'
  const btn = (text, action, attrs = '') =>
    `<button data-action="${action}" ${attrs}>${text}</button>`
  function message(text) {
    $('message').textContent = text
    clearTimeout(timer)
    timer = setTimeout(() => ($('message').textContent = ''), 4500)
  }
  function persist(next) {
    try {
      if (!storage) throw Error()
      storage.setItem(C.KEY, JSON.stringify(next))
      state = next
      return true
    } catch {
      message('瀏覽器無法儲存資料，此次變更未套用。請允許網站儲存後重試。')
      return false
    }
  }
  function confirmAction(title, text) {
    const dialog = $('confirm'),
      origin = document.activeElement
    $('confirm-title').textContent = title
    $('confirm-text').textContent = text
    return new Promise((resolve) => {
      dialog.returnValue = ''
      dialog.addEventListener(
        'close',
        () => {
          resolve(dialog.returnValue === 'ok')
          if (origin?.isConnected) origin.focus()
        },
        { once: true },
      )
      dialog.showModal()
    })
  }
  function tagsHtml(id) {
    return (
      docTags(id)
        .map((id) => `<span class="tag">${esc(D.tags.find((t) => t.id === id)?.name || '')}</span>`)
        .join('') || '<span class="muted">無標籤</span>'
    )
  }
  function actions(d) {
    return `<div class="row-actions"><a class="button" href="#tags/${d.id}" aria-label="管理 ${esc(d.title)} 標籤">標籤</a>${btn('歷史', 'history', `aria-label="${esc(d.title)} 版本歷史"`)}<a class="button" href="./downloads/sample.${d.extension}" download="${esc(d.title)}.${d.extension}" aria-label="下載 ${esc(d.title)}">下載</a>${btn('刪除', 'delete', `class="danger" data-id="${d.id}" aria-label="刪除 ${esc(d.title)}"`)}</div>`
  }
  function file(d) {
    return `<span class="file ${C.type(d.extension)}">${d.extension.toUpperCase()}</span>`
  }
  function statusHtml(d) {
    return `<span class="status ${C.status(d)}">${C.status(d) === 'draft' ? '草稿' : '已發布'}</span>`
  }
  function documentsView() {
    const docs = active()
    $('view').innerHTML =
      `<div class="heading"><div><h1>所有文件</h1><p>管理與瀏覽知識庫中的所有文件</p></div><div class="actions"><a class="button primary" href="#tags">＋ 文件標籤管理</a></div></div><section class="stats" aria-label="文件統計">${[
        ['▤', docs.length, '總文件數'],
        ['✓', docs.filter((d) => C.status(d) === 'published').length, '已發布'],
        ['✎', docs.filter((d) => C.status(d) === 'draft').length, '草稿'],
        ['◷', 0, '待審核（尚未接上）'],
      ]
        .map(
          ([icon, n, title]) =>
            `<div class="stat"><span class="stat-icon" aria-hidden="true">${icon}</span><div><strong>${n}</strong><small>${title}</small></div></div>`,
        )
        .join(
          '',
        )}</section><div class="layout"><section class="panel"><div class="panel-head"><b>資料夾</b></div><div class="folders">${[{ id: 'all', name: '所有文件' }, ...D.folders].map((f) => `<button data-folder="${f.id}" aria-pressed="${String(filters.folder) === String(f.id)}">${esc(f.name)}<small>${f.id === 'all' ? docs.length : docs.filter((d) => d.folder_id === f.id).length}</small></button>`).join('')}</div></section><section class="panel"><section class="rag" aria-label="AI 文件問答"><h2>AI 文件問答</h2><p>依目前文件知識庫回答，並顯示引用來源 chunks。</p><p>AI 回覆與檢索結果為模擬</p><form id="ask-form"><label>知識庫問題<textarea id="question" rows="3" placeholder="例如：團隊如何整理協作文件？" ${rag.busy ? 'disabled' : ''}>${esc(rag.question)}</textarea></label><button id="ask" class="primary" type="submit" ${rag.busy || !rag.question.trim() ? 'disabled' : ''}>${rag.busy ? '查詢中…' : '送出問題'}</button></form><div id="rag-result" aria-live="polite" aria-busy="${rag.busy}"></div></section><div class="toolbar"><label class="search">標題／資料夾搜尋<input id="search" type="search" value="${esc(filters.query)}" placeholder="搜尋文件標題或資料夾…"></label><label>狀態<select id="status"><option value="">所有狀態</option><option value="published">已發布</option><option value="draft">草稿</option><option value="review">待審核（未接上）</option></select></label><label>檔案類型<select id="type"><option value="">所有類型</option><option value="pdf">PDF</option><option value="word">Word</option><option value="markdown">Markdown</option></select></label><div class="actions" aria-label="檢視模式">${btn('☰ 列表', 'list', `aria-pressed="${mode === 'list'}"`)}${btn('▦ 卡片', 'grid', `aria-pressed="${mode === 'grid'}"`)}${btn('清除篩選', 'clear-filters')}</div></div><div id="results"></div></section></div>`
    $('status').value = filters.status
    $('type').value = filters.type
    $('search').addEventListener('input', (e) => {
      filters.query = e.target.value
      page = 1
      renderResults()
    })
    for (const key of ['status', 'type'])
      $(key).addEventListener('change', (e) => {
        filters[key] = e.target.value
        page = 1
        renderResults()
      })
    $('question').addEventListener('input', (e) => {
      rag.question = e.target.value
      $('ask').disabled = rag.busy || !rag.question.trim()
    })
    $('ask-form').addEventListener('submit', ask)
    renderResults()
    renderRag()
  }
  function renderResults() {
    if (!$('results')) return
    const items =
        $('list-scenario').value === 'empty'
          ? []
          : C.filter(D.documents, D.folders, state, filters),
      p = C.paginate(items, page)
    page = p.page
    const content = !p.total
      ? `<div class="empty"><h3>沒有符合條件的文件</h3><p>請調整搜尋或篩選，也可切換回正常清單。</p>${btn('清除篩選', 'clear-filters')}</div>`
      : mode === 'list'
        ? `<div class="table-wrap" tabindex="0" role="region" aria-label="可水平捲動的文件表格"><table><thead><tr><th>文件名稱</th><th>標籤</th><th>狀態</th><th>更新時間</th><th>操作</th></tr></thead><tbody>${p.items.map((d) => `<tr data-document="${d.id}"><td><div class="doc-cell">${file(d)}<div><b>${esc(d.title)}</b><small>${esc(folderName(d.folder_id))} · v${d.current_version}</small></div></div></td><td>${tagsHtml(d.id)}</td><td>${statusHtml(d)}</td><td>${d.updated_at}</td><td>${actions(d)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="cards">${p.items.map((d) => `<article class="doc-card ${C.type(d.extension)}" data-document="${d.id}"><div class="card-top">${file(d)}${statusHtml(d)}</div><h3>${esc(d.title)}</h3><p class="muted">${esc(folderName(d.folder_id))} · v${d.current_version}</p><div>${tagsHtml(d.id)}</div><p class="muted">${d.updated_at}</p>${actions(d)}</article>`).join('')}</div>`
    $('results').innerHTML =
      content +
      `<div class="pagination"><span role="status">顯示 ${p.from}–${p.to} 筆，共 ${p.total} 筆 · 每頁 10 筆</span><div class="actions">${btn('上一頁', 'prev', p.page === 1 ? 'disabled' : '')}${Array.from({ length: p.pages }, (_, i) => btn(String(i + 1), 'page', `data-page="${i + 1}" aria-label="第 ${i + 1} 頁" ${p.page === i + 1 ? 'aria-current="page" aria-pressed="true"' : ''}`)).join('')}${btn('下一頁', 'next', p.page === p.pages ? 'disabled' : '')}</div></div>`
  }
  function renderRag() {
    if (!$('rag-result')) return
    $('rag-result').innerHTML =
      (rag.error ? `<div class="error" role="alert">${esc(rag.error)}</div>` : '') +
      (rag.answer ? `<div class="answer"><h3>AI 回答 · 模擬</h3>${esc(rag.answer)}</div>` : '') +
      (rag.sources.length
        ? `<div class="sources-head"><div><b>Source Chunks</b><p>共 ${rag.sources.length} 筆引用來源，預設隱藏內容。</p></div><label><input id="sources-toggle" type="checkbox" ${rag.open ? 'checked' : ''}>顯示 Source Chunks 內容</label></div><div id="source-list" ${rag.open ? '' : 'hidden'}>${rag.sources.map((s) => `<div class="source"><strong>${esc(s.source_file)}</strong><small>Chunk #${s.chunk_index} · 相似度 ${(s.similarity * 100).toFixed(1)}%</small>${esc(s.content)}</div>`).join('')}</div>`
        : rag.answer
          ? '<p class="muted">本次回答沒有引用來源。</p>'
          : '')
    $('sources-toggle')?.addEventListener('change', (e) => {
      rag.open = e.target.checked
      $('source-list').hidden = !rag.open
    })
  }
  async function ask(e) {
    e.preventDefault()
    const question = rag.question.trim()
    if (!question || rag.busy) return
    const token = ++generation,
      scenario = $('rag-scenario').value
    rag = { question, answer: '', sources: [], error: '', busy: true, open: false }
    documentsView()
    await new Promise((resolve) => setTimeout(resolve, scenario === 'timeout' ? 1400 : 700))
    if (token !== generation) return
    rag = {
      ...rag,
      ...C.ragResult(scenario, question, D.documents, state),
      busy: false,
      open: false,
    }
    if (!location.hash.startsWith('#tags')) {
      documentsView()
      $('ask').focus()
    }
  }
  function tagsView() {
    const docs = active().filter((d) =>
        d.title.toLowerCase().includes(docQuery.toLowerCase().trim()),
      ),
      d = active().find((d) => d.id === selected)
    if (!d) selected = null
    $('view').innerHTML =
      `<div class="heading"><div><a href="#documents">← 返回文件</a><h1>文件標籤管理</h1><p>為現有文件新增、替換或移除標籤</p></div></div><div class="tag-layout"><section class="panel"><div class="panel-head"><h2>選擇文件</h2><span class="muted">共 ${active().length} 筆</span></div><div class="pad"><label>搜尋文件<input id="doc-query" type="search" value="${esc(docQuery)}" placeholder="搜尋文件標題…"></label><div class="doc-picker">${docs.map((x) => btn(esc(x.title), 'select-doc', `data-id="${x.id}" aria-pressed="${x.id === selected}"`)).join('') || '<p class="empty">找不到符合的文件</p>'}</div></div></section><section class="panel"><div class="pad">${
        d
          ? `<h2>${esc(d.title)}</h2><p class="muted">${esc(folderName(d.folder_id))} · ${d.extension.toUpperCase()} · v${d.current_version}</p><div class="panel-head"><h3>目前標籤</h3>${btn('清除全部', 'clear-tags', docTags(d.id).length ? 'class="danger"' : 'disabled')}</div><div class="tag-grid">${
              docTags(d.id)
                .map((id) =>
                  btn(
                    `${esc(D.tags.find((t) => t.id === id).name)} ×`,
                    'remove-tag',
                    `data-id="${id}" aria-label="移除 ${esc(D.tags.find((t) => t.id === id).name)}"`,
                  ),
                )
                .join('') || '<p class="muted">尚未加入任何標籤</p>'
            }</div><h3>新增標籤</h3><div class="actions">${[
              ['single', '單筆'],
              ['batch', '批次'],
              ['replace', '替換'],
            ]
              .map(([m, n]) =>
                btn(n, 'tag-mode', `data-mode="${m}" aria-pressed="${addMode === m}"`),
              )
              .join(
                '',
              )}</div><p class="mode-hint">${addMode === 'single' ? '點選標籤即新增，不影響已有標籤。' : addMode === 'batch' ? '選取多個標籤後批次新增，保留原標籤並略過重複。' : '選取標籤將完整取代目前所有標籤。已套用的標籤依原介面不可重選；如需保留，請先移除再選取。'}</p><label>搜尋標籤<input id="tag-query" type="search" value="${esc(tagQuery)}" placeholder="搜尋標籤名稱…"></label><div class="tag-grid">${
              D.tags
                .filter((t) => t.name.includes(tagQuery.trim()))
                .map((t) =>
                  btn(
                    `${esc(t.name)}${docTags(d.id).includes(t.id) ? '（已套用）' : ''}`,
                    'choose-tag',
                    `data-id="${t.id}" ${docTags(d.id).includes(t.id) ? 'disabled' : `aria-pressed="${batch.includes(t.id)}"`}`,
                  ),
                )
                .join('') || '<p>找不到符合的標籤</p>'
            }</div>${addMode !== 'single' ? `<div class="actions"><span class="muted">已選 ${batch.length} 個</span>${btn('清除選取', 'clear-batch')}${btn(addMode === 'batch' ? '批次新增' : '確認替換', 'submit-tags', `class="primary" ${batch.length ? '' : 'disabled'}`)}</div>` : ''}`
          : '<div class="empty"><h2>請先選擇一份文件</h2><p>此處管理既有文件標籤，不提供正文編輯。</p></div>'
      }</div></section></div>`
    for (const [id, key] of [
      ['doc-query', 'doc'],
      ['tag-query', 'tag'],
    ])
      $(id)?.addEventListener('input', (e) => {
        const pos = e.target.selectionStart
        if (key === 'doc') docQuery = e.target.value
        else tagQuery = e.target.value
        tagsView()
        $(id).focus()
        $(id).setSelectionRange(pos, pos)
      })
  }
  function update(ids, kind) {
    if (!selected) return
    const next = {
      ...state,
      tags: { ...state.tags, [selected]: C.updateTags(docTags(selected), ids, kind) },
    }
    if (persist(next)) {
      batch = []
      tagsView()
      message('文件標籤已更新')
    }
  }
  function route() {
    const m = location.hash.match(/^#tags(?:\/(\d+))?$/)
    document
      .querySelectorAll('nav a')
      .forEach((x) => x.classList.toggle('active', x.hash === (m ? '#tags' : '#documents')))
    if (m) {
      selected = m[1] ? Number(m[1]) : null
      batch = []
      addMode = 'single'
      docQuery = ''
      tagQuery = ''
      tagsView()
    } else documentsView()
  }
  document.addEventListener('click', async (e) => {
    const scope = e.target.closest('[data-scope]')
    if (scope) {
      message(`${scope.dataset.scope}不在本展示範圍；本版僅展示文件瀏覽、標籤與 RAG 問答。`)
      return
    }
    const folder = e.target.closest('[data-folder]')
    if (folder) {
      filters.folder = folder.dataset.folder
      page = 1
      documentsView()
      document.querySelector('[data-folder="' + filters.folder + '"]')?.focus()
      return
    }
    const b = e.target.closest('[data-action]')
    if (!b || b.disabled) return
    const a = b.dataset.action,
      id = Number(b.dataset.id)
    if (a === 'list' || a === 'grid') {
      mode = a
      documentsView()
    }
    if (a === 'prev' || a === 'next' || a === 'page') {
      page = a === 'page' ? Number(b.dataset.page) : page + (a === 'next' ? 1 : -1)
      renderResults()
    }
    if (a === 'clear-filters') {
      filters = { query: '', folder: 'all', status: '', type: '' }
      page = 1
      $('list-scenario').value = 'normal'
      documentsView()
    }
    if (a === 'history') message('版本歷史不在本展示範圍；下載提供對應格式的虛構範例檔。')
    if (a === 'delete') {
      const d = active().find((d) => d.id === id)
      if (!d) return
      if (
        !(await confirmAction(
          '確認刪除文件？',
          `將刪除「${d.title}」，只影響本展示的本地資料。可使用展示工具重設。`,
        ))
      )
        return
      if ($('delete-scenario').value === 'error') {
        message('刪除失敗（展示情境），文件與統計未變更。')
        return
      }
      if (persist({ ...state, deleted: [...new Set([...state.deleted, id])] })) {
        documentsView()
        message('文件已刪除，清單與統計已更新')
      }
    }
    if (a === 'select-doc') {
      selected = id
      batch = []
      tagQuery = ''
      addMode = 'single'
      tagsView()
    }
    if (a === 'tag-mode') {
      addMode = b.dataset.mode
      batch = []
      tagsView()
    }
    if (a === 'choose-tag' && selected && !docTags(selected).includes(id)) {
      if (addMode === 'single') update([id], 'add')
      else {
        batch = batch.includes(id) ? batch.filter((x) => x !== id) : [...batch, id]
        tagsView()
      }
    }
    if (a === 'remove-tag') update([id], 'remove')
    if (a === 'clear-batch') {
      batch = []
      tagsView()
    }
    if (a === 'submit-tags' && batch.length)
      update(batch, addMode === 'replace' ? 'replace' : 'add')
    if (!b.isConnected) {
      const match = [...document.querySelectorAll('[data-action]')].find(
        (x) =>
          x.dataset.action === a &&
          (!b.dataset.id || x.dataset.id === b.dataset.id) &&
          (!b.dataset.mode || x.dataset.mode === b.dataset.mode) &&
          (!b.dataset.page || x.dataset.page === b.dataset.page),
      )
      ;(match || document.querySelector('#results [tabindex]') || $('main'))?.focus()
    }
    if (a === 'clear-tags' && selected) {
      const target = selected
      if (
        (await confirmAction(
          '確認清除所有標籤？',
          '此文件的所有標籤將被移除；可透過展示工具重設。',
        )) &&
        target === selected
      )
        update([], 'replace')
    }
  })
  $('list-scenario').addEventListener('change', () => {
    page = 1
    renderResults()
  })
  $('reset').addEventListener('click', async () => {
    if (
      !(await confirmAction(
        '重設展示資料？',
        '將清除本展示儲存的標籤與刪除紀錄，不影響其他網站資料。',
      ))
    )
      return
    try {
      if (!storage) throw Error()
      storage.removeItem(C.KEY)
    } catch {
      message('無法清除儲存資料，請檢查瀏覽器設定。')
      return
    }
    generation++
    state = C.initial()
    rag = { question: '', answer: '', sources: [], error: '', busy: false, open: false }
    filters = { query: '', folder: 'all', status: '', type: '' }
    page = 1
    mode = 'list'
    ;['list-scenario', 'delete-scenario', 'rag-scenario'].forEach((id) => ($(id).selectedIndex = 0))
    route()
    message('展示資料已重設')
  })
  window.addEventListener('hashchange', () => {
    route()
    $('main').focus()
  })
  route()
  if (!storage) message('瀏覽器禁止儲存，仍可瀏覽與問答；標籤及刪除變更無法保存。')
})()

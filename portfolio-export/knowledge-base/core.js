;(function (root) {
  'use strict'
  const KEY = 'portfolio.knowledge-base.v1.state'
  const status = (d) => (d.is_format_correct === false ? 'draft' : 'published')
  const type = (ext) => ({ doc: 'word', docx: 'word', md: 'markdown' })[ext] || ext
  const initial = () => ({ deleted: [], tags: {} })
  function filter(documents, folders, state, f = {}) {
    const q = (f.query || '').toLowerCase()
    return documents
      .filter((d) => !d.is_deleted && !state.deleted.includes(d.id))
      .filter((d) => {
        const folder = folders.find((x) => x.id === d.folder_id)?.name || '根目錄'
        return (
          (!q ||
            d.title.toLowerCase().includes(q) ||
            folder.toLowerCase().includes(q) ||
            ('資料夾 ' + d.folder_id).includes(q)) &&
          (!f.status || status(d) === f.status) &&
          (!f.type || type(d.extension) === f.type) &&
          (!f.folder || f.folder === 'all' || d.folder_id === Number(f.folder))
        )
      })
  }
  function paginate(items, requested) {
    const pages = Math.max(1, Math.ceil(items.length / 10)),
      page = Math.min(pages, Math.max(1, Number(requested) || 1))
    return {
      page,
      pages,
      total: items.length,
      from: items.length ? (page - 1) * 10 + 1 : 0,
      to: Math.min(page * 10, items.length),
      items: items.slice((page - 1) * 10, page * 10),
    }
  }
  function updateTags(current, ids, mode) {
    const unique = [...new Set(ids)]
    if (mode === 'replace') return unique
    if (mode === 'remove') return current.filter((id) => !unique.includes(id))
    return [...new Set([...current, ...unique])]
  }
  function load(storage, data) {
    try {
      const raw = JSON.parse(storage.getItem(KEY))
      if (!raw || !Array.isArray(raw.deleted) || !raw.tags || typeof raw.tags !== 'object')
        return initial()
      const ds = new Set(data.documents.map((d) => d.id)),
        ts = new Set(data.tags.map((t) => t.id))
      return {
        deleted: [...new Set(raw.deleted.filter((id) => ds.has(id)))],
        tags: Object.fromEntries(
          Object.entries(raw.tags)
            .filter(([id, ids]) => ds.has(Number(id)) && Array.isArray(ids))
            .map(([id, ids]) => [id, [...new Set(ids.filter((t) => ts.has(t)))]]),
        ),
      }
    } catch {
      return initial()
    }
  }
  function ragResult(scenario, question, documents, state) {
    if (scenario === 'timeout')
      return { error: 'AI 回應時間較長，請稍後再試，或縮小問題範圍後重新送出。（模擬逾時）' }
    if (scenario === 'error') return { error: 'RAG 問答查詢失敗，請重新送出。（展示錯誤）' }
    const available = documents.filter((d) => !d.is_deleted && !state.deleted.includes(d.id))
    if (scenario === 'empty' || !available.length)
      return { answer: '目前找不到足夠的文件內容可回答此問題。', sources: [] }
    const answer = /標籤/.test(question)
      ? '依主題與用途選用標籤。批次新增只加入尚未套用的項目；替換會完整取代原標籤。'
      : '先閱讀團隊指南，依資料夾尋找主題文件。交接前整理決策、檢查清單及文件標籤，便於追溯工作脈絡。'
    return {
      answer: answer + '（預設示範摘要）',
      sources:
        scenario === 'no-sources'
          ? []
          : available.slice(0, 2).map((d, i) => ({
              source_file: d.title + '.' + d.extension,
              chunk_index: i + 1,
              similarity: i ? 0.843 : 0.926,
              content: i
                ? '文件維護應記錄更新脈絡，依主題分類並定期檢查標籤。'
                : '團隊指南提供文件導覽、協作約定與知識整理原則。所有內容皆為虛構素材。',
            })),
    }
  }
  const api = { KEY, status, type, initial, filter, paginate, updateTags, load, ragResult }
  if (typeof module !== 'undefined') module.exports = api
  else root.KB = api
})(typeof window === 'undefined' ? globalThis : window)

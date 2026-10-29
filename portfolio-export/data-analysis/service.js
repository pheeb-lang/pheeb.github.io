export const STORAGE_KEY = 'portfolio:data-analysis:v1:records'
export const SCENARIOS = ['normal', 'multi', 'missing', 'empty', 'analysis-failure', 'save-failure']

export function createDemoService({
  fetcher = (...args) => fetch(...args),
  storage = () => localStorage,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  async function get(path, json = false) {
    const response = await fetcher(path)
    if (!response.ok) throw new Error('本地展示資源載入失敗：' + path)
    return json ? response.json() : response.text()
  }
  function checkScenario(id) {
    if (!SCENARIOS.includes(id)) throw new Error('未知展示情境')
  }
  function readRecords() {
    const records = JSON.parse(storage().getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(records)) throw new Error('本地紀錄格式異常，請重設本展示紀錄。')
    return records
  }
  return {
    async sample(id) {
      checkScenario(id)
      const text = await get('./samples/' + id + '.csv')
      return new File([text], id + '.csv', { type: 'text/csv' })
    },
    async analyze(file, chartType, id) {
      // No file content is read or transmitted.
      if (!file) throw new Error('請先選擇檔案。')
      checkScenario(id)
      await delay(650)
      const fixture = await get('./fixtures/' + id + '.json', true)
      if (fixture.analysis_error) throw new Error(fixture.analysis_error)
      return fixture
    },
    async save(payload, simulateFailure = false) {
      await delay(500)
      if (simulateFailure) throw new Error('展示情境：模擬加入 RAG 知識庫失敗。未寫入本地紀錄。')
      try {
        const records = readRecords()
        const serialized = JSON.stringify(payload)
        const chunks = Array.from({ length: Math.ceil(serialized.length / 500) }, (_, i) =>
          serialized.slice(i * 500, (i + 1) * 500),
        )
        records.push({
          saved_at: new Date().toISOString(),
          payload,
          chunks,
          chunks_count: chunks.length,
        })
        storage().setItem(STORAGE_KEY, JSON.stringify(records))
        return { rag_status: 'local_simulation', chunks_count: chunks.length }
      } catch (error) {
        throw new Error('本地儲存失敗：' + error.message + '（可檢查瀏覽器儲存權限或重設紀錄）')
      }
    },
    readRecords,
    reset() {
      storage().removeItem(STORAGE_KEY)
    },
  }
}

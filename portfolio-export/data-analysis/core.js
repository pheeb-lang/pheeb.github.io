const normalizeChartSources = (source) => {
  if (!source) return []
  return Array.isArray(source) ? source.filter(hasChartData) : hasChartData(source) ? [source] : []
}

const buildMultiCategoryChartData = (sources) => {
  const labels = [
    ...new Set(
      sources.flatMap((source) =>
        Array.isArray(source.data)
          ? source.data.map((item) => item.label ?? item.month ?? item.date ?? item.name)
          : [],
      ),
    ),
  ].filter(Boolean)

  if (!labels.length) return null

  return {
    labels,
    datasets: sources.map((source, index) => {
      const valuesByLabel = new Map(
        source.data.map((item) => [
          item.label ?? item.month ?? item.date ?? item.name,
          item.value ?? item.count ?? item.total ?? 0,
        ]),
      )

      return {
        label: source.column ?? source.title ?? `資料 ${index + 1}`,
        data: labels.map((label) => valuesByLabel.get(label) ?? 0),
        backgroundColor: chartPalette[index % chartPalette.length],
        borderColor: chartPalette[index % chartPalette.length],
        borderWidth: 1,
      }
    }),
  }
}

const normalizeChartData = (source, type) => {
  if (source?.labels && source?.datasets) return source

  const itemData = Array.isArray(source?.data) ? source.data : null
  const mapData =
    source && !Array.isArray(source) && typeof source === 'object' && !source.values && !source.data
      ? source
      : null
  const labels =
    source?.labels ??
    source?.x ??
    source?.categories ??
    (itemData
      ? itemData.map((item) => item.label ?? item.month ?? item.date ?? item.name)
      : mapData
        ? Object.keys(mapData)
        : [])
  const values =
    source?.values ??
    source?.y ??
    (itemData
      ? itemData.map((item) => item.value ?? item.count ?? item.total ?? 0)
      : mapData
        ? Object.values(mapData)
        : [])
  const label = source?.label ?? source?.column ?? '數值'

  return {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: type === 'pie' ? chartPalette : 'rgba(37, 99, 235, 0.75)',
        borderColor: type === 'pie' ? '#ffffff' : 'rgb(37, 99, 235)',
        borderWidth: type === 'pie' ? 2 : 1,
        tension: type === 'line' ? 0.35 : 0,
        fill: false,
      },
    ],
  }
}

const hasChartData = (data) => {
  if (!data) return false
  if (Array.isArray(data)) return data.some(hasChartData)
  if (Array.isArray(data?.datasets)) return data.datasets.some((dataset) => dataset.data?.length)
  if (Array.isArray(data?.data)) return data.data.length > 0
  const values = data.values ?? data.data ?? data.y
  if (Array.isArray(values)) return values.length > 0
  return typeof data === 'object' && Object.keys(data).length > 0
}

const getMissingValueCount = (data) => {
  const value =
    data.missing_value_count ??
    data.missing_values_count ??
    data.missing_count ??
    data.null_count ??
    data.missing_values

  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + Number(item || 0), 0)
  }

  return value
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString()
}

const formatFileSize = (size) => {
  if (!size) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

const chartPalette = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#475569',
]

export {
  normalizeChartSources,
  buildMultiCategoryChartData,
  normalizeChartData,
  hasChartData,
  getMissingValueCount,
  formatNumber,
  formatFileSize,
  formatCell,
  chartPalette,
}

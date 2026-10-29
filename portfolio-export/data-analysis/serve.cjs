const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path')
const root = __dirname,
  prefix = '/portfolio/demos/data-analysis/'
function createServer(log = []) {
  return http.createServer((req, res) => {
    let url = new URL(req.url, 'http://local').pathname
    if (url === '/portfolio/demos/data-analysis') {
      res.writeHead(302, { Location: prefix })
      res.end()
      return
    }
    let relative = url.startsWith(prefix) ? url.slice(prefix.length) : url.replace(/^\//, '')
    if (!relative) relative = 'index.html'
    let file
    try {
      file = path.resolve(root, decodeURIComponent(relative))
    } catch {
      res.writeHead(400)
      res.end()
      return
    }
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      log.push({ url, status: 404 })
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.csv': 'text/csv; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.md': 'text/markdown; charset=utf-8',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    log.push({ url, status: 200 })
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
}
module.exports = { createServer, prefix }
if (require.main === module) {
  const port = Number(process.argv[2] || 4183)
  createServer().listen(port, '127.0.0.1', () =>
    console.log('Demo: http://127.0.0.1:' + port + prefix),
  )
}

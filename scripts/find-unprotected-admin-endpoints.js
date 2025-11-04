const fs = require('fs')
const path = require('path')

const adminDir = path.join(__dirname, '..', 'pages', 'api', 'admin')

function listFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'))
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const usesWithAuth = content.includes('withAuth(') || content.includes("export default withAuth")
  return { file: path.basename(filePath), usesWithAuth }
}

function main() {
  if (!fs.existsSync(adminDir)) {
    console.error('Admin directory not found:', adminDir)
    process.exit(1)
  }
  const files = listFiles(adminDir)
  const results = files.map((f) => checkFile(path.join(adminDir, f)))
  console.log('Admin endpoints scan:')
  results.forEach((r) => {
    console.log(`${r.usesWithAuth ? '✔' : '✖'} ${r.file}`)
  })
  const unprotected = results.filter((r) => !r.usesWithAuth).map((r) => r.file)
  if (unprotected.length > 0) {
    console.log('\nUnprotected admin endpoints:')
    unprotected.forEach((u) => console.log(` - ${u}`))
    process.exitCode = 2
  } else {
    console.log('\nAll admin endpoints use withAuth.')
  }
}

main()

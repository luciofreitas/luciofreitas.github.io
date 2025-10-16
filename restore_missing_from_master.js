const fs = require('fs')
const path = require('path')
const child = require('child_process')

const root = process.cwd()
const listPath = path.join(root, 'missing_references.txt')
if (!fs.existsSync(listPath)) {
  console.error('missing_references.txt not found. Run scan_missing.js first.')
  process.exit(1)
}

const lines = fs.readFileSync(listPath, 'utf8').split(/\r?\n/).filter(Boolean)
const results = []

for (const line of lines) {
  const parts = line.split('->').map(s => s.trim())
  if (parts.length < 2) continue
  const fileRef = parts[0]
  const p = parts[1]
  // fileRef is absolute path to source file
  const srcFile = fileRef.split(':')[0]
  const rel = p
  let resolved
  if (rel.startsWith('/')) {
    resolved = path.join(root, rel.replace(/^\/, ''))
  } else {
    resolved = path.resolve(path.dirname(srcFile), rel)
  }
  // compute repo relative path
  const repoRel = path.relative(root, resolved).replace(/\\/g, '/')

  try {
    const buf = child.execSync(`git show origin/master:${repoRel}`, { encoding: 'buffer', stdio: ['ignore', 'pipe', 'ignore'] })
    // ensure dir exists
    const outPath = resolved
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, buf)
    results.push({ repoRel, status: 'restored', outPath })
    console.log(`Restored: ${repoRel} -> ${outPath}`)
  } catch (err) {
    results.push({ repoRel, status: 'not-found' })
    console.log(`Not found in origin/master: ${repoRel}`)
  }
}

fs.writeFileSync(path.join(root, 'restore_report.json'), JSON.stringify(results, null, 2), 'utf8')
console.log('\nWrote restore_report.json')

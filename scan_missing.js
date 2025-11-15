const fs = require('fs')
const path = require('path')

const root = process.cwd()
const exts = ['.js', '.jsx', '.ts', '.tsx', '.html']
const files = []

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      // skip node_modules and dist
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue
      walk(full)
    } else {
      if (exts.includes(path.extname(name))) files.push(full)
    }
  }
}

walk(root)
const missing = new Set()
const importRegex = /from\s+['\"]([^'\"]+)['\"]/g
const srcHrefRegex = /(src|href)\s*=\s*['\"]([^'\"]+)['\"]/g

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8')
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let m
    importRegex.lastIndex = 0
    while ((m = importRegex.exec(line)) !== null) {
      const p = m[1]
      checkPath(f, i+1, p)
    }
    srcHrefRegex.lastIndex = 0
    while ((m = srcHrefRegex.exec(line)) !== null) {
      const p = m[2]
      checkPath(f, i+1, p)
    }
  }
}

function checkPath(file, lineNo, p) {
  if (!p) return
  if (!(p.startsWith('.') || p.startsWith('/'))) return
  let resolved = null
  if (p.startsWith('/')) {
    resolved = path.join(root, p.replace(/^\/,'').split('?')[0].split('#')[0])
  } else {
    resolved = path.resolve(path.dirname(file), p.split('?')[0].split('#')[0])
  }
  // if path without extension exists, try common image extensions or index files
  if (!fs.existsSync(resolved)) {
    const candidates = [resolved, resolved + '.js', resolved + '.jsx', resolved + '.ts', resolved + '.tsx', resolved + '.css', resolved + '.jpg', resolved + '.png', resolved + '.svg', path.join(resolved, 'index.js')]
    const found = candidates.find(c => fs.existsSync(c))
    if (!found) missing.add(`${file}:${lineNo} -> ${p}`)
  }
}

if (missing.size === 0) {
  console.log('No missing relative imports found.')
} else {
  const arr = Array.from(missing).sort()
  console.log('Found missing references:')
  arr.forEach(l => console.log(l))
  fs.writeFileSync(path.join(root, 'missing_references.txt'), arr.join('\n'), 'utf8')
  console.log('\nSaved list to missing_references.txt')
}

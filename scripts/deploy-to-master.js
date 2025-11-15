const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const docsDir = path.join(root, 'docs');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

try {
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Did build succeed?');
    process.exit(1);
  }

  console.log('Cleaning docs/ directory...');
  rmrf(docsDir);
  fs.mkdirSync(docsDir, { recursive: true });

  console.log('Copying dist -> docs...');
  copyRecursive(distDir, docsDir);

  // Stage docs
  console.log('Staging docs/ in git...');
  execSync('git add docs', { cwd: root, stdio: 'inherit' });

  // Commit if changes
  try {
    execSync('git commit -m "Deploy: build -> docs (GitHub Pages from master/docs)"', { cwd: root, stdio: 'inherit' });
  } catch (err) {
    console.log('No changes to commit (docs may be up to date).');
  }

  // Push to master
  console.log('Pushing to origin master...');
  execSync('git push origin master', { cwd: root, stdio: 'inherit' });

  console.log('\nDeploy completed. Please ensure GitHub Pages is configured to serve from branch: master / folder: /docs.');
} catch (err) {
  console.error('Deploy failed:', err);
  process.exit(1);
}

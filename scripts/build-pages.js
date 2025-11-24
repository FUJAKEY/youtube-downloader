const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'public');
const target = path.join(__dirname, '..', 'pages-dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(source, target);
console.log(`Статические файлы скопированы из ${source} в ${target}`);

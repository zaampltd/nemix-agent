const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

console.log("=== SCANNING FOR ASIDE TAGS ===");
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('<aside') || line.includes('</aside>')) {
    console.log(`[Line ${lineNum}]: ${line.trim()}`);
  }
});

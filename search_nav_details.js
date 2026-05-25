const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

console.log("=== DISPLAY SIDEBAR NAV BLOCK (LINES 550-650) ===");
for (let i = 549; i < 650; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}

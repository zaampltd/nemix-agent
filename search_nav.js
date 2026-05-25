const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

console.log("=== SCANNING FOR SIDEBAR TABS ===");
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('setActiveTab') || line.includes('activeTab ===') || line.includes('LayoutDashboard') || line.includes('Settings')) {
    if (line.includes('button') || line.includes('className') || line.includes('icon')) {
      console.log(`[Line ${lineNum}]: ${line.trim()}`);
    }
  }
});

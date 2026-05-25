const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

lines.forEach((line, index) => {
  if (line.includes("activeTab === 'Settings'")) {
    console.log(`[Line ${index+1}]: ${line.trim()}`);
    // Print next 5 lines
    for (let j = 1; j <= 5; j++) {
      console.log(`   +${j}: ${lines[index+j] ? lines[index+j].trim() : ''}`);
    }
  }
});

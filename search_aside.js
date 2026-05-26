const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'data') {
        search(fullPath);
      }
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('Understood. As CEO')) {
        console.log('FOUND IN FILE:', fullPath);
      }
    }
  }
}

search(__dirname);

const fs = require('fs');
const path = require('path');

const excludeDirs = [
  'node_modules',
  '.next',
  'venv',
  '.venv',
  'env',
  '.git',
  '.idea',
  '.vscode',
  'dist',
  'build',
  'bin',
  'obj'
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace various case occurrences
    content = content.replace(/Nvmix/g, 'Nvmix');
    content = content.replace(/nvmix/g, 'nvmix');
    content = content.replace(/NVMIX/g, 'NVMIX');
    
    // Also replace old domains and API keys references
    content = content.replace(/api\.nvmix\.ai/g, 'api.nvmix.com');
    content = content.replace(/nvmix-jjjj\.vercel\.app/g, 'nvmix.com');
    content = content.replace(/nvx_sk_/g, 'nvx_sk_');
    content = content.replace(/nvx_/g, 'nvx_');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    // Ignore binary/inaccessible files
  }
}

function walkDir(dir) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.lstatSync(fullPath); // Use lstatSync to handle symlinks safely
      
      if (stat.isSymbolicLink()) {
        return; // Skip symbolic links to avoid loops
      }

      // Exclude directories based on our blacklist
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file) && !file.startsWith('.')) {
          walkDir(fullPath);
        }
      } else {
        const ext = path.extname(file);
        // Scan standard text files
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html', '.txt', '.yml', '.yaml', '.env', '.local'].includes(ext) || file === '.env.local') {
          replaceInFile(fullPath);
        }
      }
    });
  } catch (err) {
    console.error(`Error walking ${dir}:`, err.message);
  }
}

console.log('--- STARTING GLOBAL NAME REPLACEMENT ---');
console.log('Scanning Project 2 (nvmix-agent)...');
walkDir('C:\\Users\\shahi\\.gemini\\antigravity\\scratch\\nvmix-agent');

console.log('\nScanning Project 1 (ai-saas-platform/frontend)...');
walkDir('C:\\Users\\shahi\\ai-saas-platform\\frontend');

console.log('\nScanning Project 1 (ai-saas-platform/backend)...');
walkDir('C:\\Users\\shahi\\ai-saas-platform\\backend');

console.log('\nScanning root files in ai-saas-platform...');
const rootFiles = ['C:\\Users\\shahi\\ai-saas-platform\\docker-compose.yml', 'C:\\Users\\shahi\\ai-saas-platform\\README.md'];
rootFiles.forEach(file => {
  if (fs.existsSync(file)) {
    replaceInFile(file);
  }
});

console.log('\n--- GLOBAL NAME REPLACEMENT COMPLETED ---');

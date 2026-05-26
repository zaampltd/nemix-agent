const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'data', 'chats', 'chat_cmi22hxan_1779705439899.json');
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
console.log(data.slice(-5));

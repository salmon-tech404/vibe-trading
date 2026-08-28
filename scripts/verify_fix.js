const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

console.log('Includes ctrlKey check:', content.includes('e.ctrlKey || e.metaKey || e.altKey'));

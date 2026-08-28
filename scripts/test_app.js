const fs = require('fs');

const content = fs.readFileSync('C:/Users/TMS/Downloads/Web_Quiz.html', 'utf8');

console.log('Includes 100vh / 100dvh:', content.includes('100dvh') && content.includes('overflow: hidden'));
console.log('Includes expanded max-width 1020px:', content.includes('max-width: 1020px'));
console.log('Includes 2-column layout:', content.includes('grid-template-columns: 280px 1fr'));
console.log('Total questions:', (content.match(/"id":/g) || []).length);
console.log('File size:', fs.statSync('C:/Users/TMS/Downloads/Web_Quiz.html').size);

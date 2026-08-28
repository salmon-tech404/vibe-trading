const fs = require('fs');

const content = fs.readFileSync('C:/Users/TMS/Downloads/Quan_Ly_Phan_Mem.html', 'utf8');

console.log('File size:', fs.statSync('C:/Users/TMS/Downloads/Quan_Ly_Phan_Mem.html').size);
console.log('Total questions in file:', (content.match(/"id":/g) || []).length);
console.log('Includes 100vh / 100dvh:', content.includes('100dvh') && content.includes('overflow: hidden'));
console.log('Includes expanded widescreen (max-width: 1160px):', content.includes('max-width: 1160px'));
console.log('Includes 6-column grid for 150 questions:', content.includes('grid-template-columns: repeat(6, 1fr)'));
console.log('Includes Ctrl+C modifier check:', content.includes('e.ctrlKey || e.metaKey || e.altKey'));

const testEmojis = ['📌', '🔍', '⚠️', '💡', '🌟', '🚀', '🎯', '🔘', '🔵', '🟢', '🔴'];
const found = testEmojis.filter(e => content.includes(e));
console.log('Emojis found:', found);

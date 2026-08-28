const fs = require('fs');

const content = fs.readFileSync('C:/Users/TMS/Downloads/Web_Quiz.html', 'utf8');

const testEmojis = ['📌', '🔍', '⚠️', '💡', '🌟', '🚀', '🎯', '🔘', '🔵', '🟢', '🔴'];
const found = [];

testEmojis.forEach(emoji => {
  if (content.includes(emoji)) {
    found.push(emoji);
  }
});

console.log('Tested emojis found in Web_Quiz.html:', found);
console.log('Clean check passed:', found.length === 0);

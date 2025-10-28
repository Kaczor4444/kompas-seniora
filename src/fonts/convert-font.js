const fs = require('fs');
const fontData = fs.readFileSync('src/fonts/Roboto-Regular.ttf');
const base64 = fontData.toString('base64');
const output = `module.exports = "${base64}";`;
fs.writeFileSync('src/fonts/roboto-normal.js', output);
console.log('Font converted! Size:', output.length, 'bytes');

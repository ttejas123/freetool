import { sanitizeFilename } from './src/lib/utils.js';

console.log('Test 1:', sanitizeFilename('my image.png')); // Expected: my_image.png
console.log('Test 2:', sanitizeFilename('my!@#$%^&*() image.png')); // Expected: my_image.png
console.log('Test 3:', sanitizeFilename('  spaces  Everywhere  .jpg  ')); // Expected: spaces_Everywhere.jpg
console.log('Test 4:', sanitizeFilename('multiple.dots.in.name.pdf')); // Expected: multiple.dots.in.name.pdf
console.log('Test 5:', sanitizeFilename('dash-and_underscore.txt')); // Expected: dash-and_underscore.txt
console.log('Test 6:', sanitizeFilename('filename with symbols [] {}.png')); // Expected: filename_with_symbols_.png

function sanitizeFilename(filename) {
  if (!filename) return 'file-' + Date.now();
  const normalized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const parts = normalized.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  const nameWithoutExt = parts.join('_');
  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  const finalName = sanitized || 'file';
  return ext ? finalName + '.' + ext : finalName;
}

function sanitizePath(path) {
    return path
      .split('/')
      .map(part => part.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '_'))
      .join('/')
      .replace(/\/+/g, '/');
}

console.log('Test 1 (Space):', sanitizeFilename('my image.png'));
console.log('Test 2 (Accents):', sanitizeFilename('éèà.png'));
console.log('Test 3 (Special chars):', sanitizeFilename('my!@#$%^&*() photo.png'));
console.log('Test 4 (Multi-dot):', sanitizeFilename('my.file.name.pdf'));
console.log('Test 5 (Brackets):', sanitizeFilename('image (1).png'));

const path = 'user uploads/test path/';
const name = sanitizeFilename('my image.png');
const key = (sanitizePath(path) + '123-' + name).replace(/^_+/, '');
console.log('Test Key:', key);

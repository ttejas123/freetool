import fs from 'fs';
import path from 'path';

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

const distPath = path.join(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  const sizeBytes = getDirectorySize(distPath);
  const sizeMB = sizeBytes / (1024 * 1024);
  
  console.log(`\n📦 Total Build Size: ${sizeMB.toFixed(2)} MB`);

  if (sizeMB > 5) {
    console.log(`\n⚠️  WARNING: The build size is over 5MB!`);
    console.log(`To improve this, consider:\n - Lazy loading components using React.lazy (e.g. tools that aren't accessed immediately)`);
    console.log(` - Checking if there are large static assets/models loaded globally that can be fetched dynamically`);
    console.log(` - Analyzing the bundle with something like 'rollup-plugin-visualizer'`);
  } else {
    console.log(`\n✨ Excellent! The build is nice and lean (< 5MB).`);
  }
} else {
  console.error("❌ 'dist' directory not found. Did the build fail?");
}

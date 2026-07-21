const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const distDir = path.join(frontendRoot, 'dist');
const buildDir = path.join(frontendRoot, 'build');

if (!fs.existsSync(distDir)) {
  console.error('Expected Vite output directory to exist:', distDir);
  process.exit(1);
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.cpSync(distDir, buildDir, { recursive: true });
console.log('Copied Vite output from dist/ to build/ for Render.');

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

// Size limits in bytes (after gzip)
const SIZE_LIMITS = {
  // Main bundle should be under 200KB after gzip
  main: 200 * 1024,
  // Vendor bundle should be under 300KB after gzip  
  vendor: 300 * 1024,
  // Chart bundle should be under 100KB after gzip
  charts: 100 * 1024,
  // Maps bundle should be under 150KB after gzip
  maps: 150 * 1024,
  // Individual chunks should be under 50KB after gzip
  chunk: 50 * 1024,
  // Total bundle size should be under 1MB after gzip
  total: 1024 * 1024,
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGzipSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return gzipSync(content).length;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return 0;
  }
}

function checkBundleSizes() {
  const buildDir = path.join(process.cwd(), 'build', 'static', 'js');
  
  if (!fs.existsSync(buildDir)) {
    console.error(`${colors.red}❌ Build directory not found: ${buildDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.bold}${colors.blue}📊 Bundle Size Analysis${colors.reset}\n`);
  console.log('Analyzing JavaScript bundles after gzip compression...\n');

  const files = fs.readdirSync(buildDir).filter(file => 
    file.endsWith('.js') && !file.endsWith('.js.map') && !file.endsWith('.LICENSE.txt')
  );

  if (files.length === 0) {
    console.error(`${colors.red}❌ No JavaScript files found in ${buildDir}${colors.reset}`);
    process.exit(1);
  }

  const results = [];
  let totalSize = 0;
  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    const rawSize = stats.size;
    const gzipSize = getGzipSize(filePath);
    
    totalSize += gzipSize;

    // Determine bundle type and check against limits
    let bundleType = 'chunk';
    let limit = SIZE_LIMITS.chunk;
    
    if (file.includes('vendor')) {
      bundleType = 'vendor';
      limit = SIZE_LIMITS.vendor;
    } else if (file.includes('main')) {
      bundleType = 'main';
      limit = SIZE_LIMITS.main;
    } else if (file.includes('charts')) {
      bundleType = 'charts';
      limit = SIZE_LIMITS.charts;
    } else if (file.includes('maps')) {
      bundleType = 'maps';
      limit = SIZE_LIMITS.maps;
    }

    const isOverLimit = gzipSize > limit;
    if (isOverLimit) hasErrors = true;

    const status = isOverLimit ? 
      `${colors.red}❌ OVER LIMIT` : 
      `${colors.green}✅ OK`;
    
    const percentage = ((gzipSize / limit) * 100).toFixed(1);
    
    results.push({
      file,
      bundleType,
      rawSize,
      gzipSize,
      limit,
      isOverLimit,
      percentage: parseFloat(percentage)
    });

    console.log(`${status}${colors.reset} ${file}`);
    console.log(`   Type: ${bundleType.toUpperCase()}`);
    console.log(`   Raw size: ${formatBytes(rawSize)}`);
    console.log(`   Gzipped: ${formatBytes(gzipSize)} / ${formatBytes(limit)} (${percentage}%)`);
    console.log('');
  }

  // Check total size
  const totalOverLimit = totalSize > SIZE_LIMITS.total;
  if (totalOverLimit) hasErrors = true;

  console.log(`${colors.bold}📈 Summary${colors.reset}`);
  console.log(`Total bundles analyzed: ${files.length}`);
  console.log(`Total gzipped size: ${formatBytes(totalSize)} / ${formatBytes(SIZE_LIMITS.total)} (${((totalSize / SIZE_LIMITS.total) * 100).toFixed(1)}%)`);
  
  if (totalOverLimit) {
    console.log(`${colors.red}❌ Total size exceeds limit${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Total size within limits${colors.reset}`);
  }

  console.log('\n');

  // Show recommendations if there are issues
  if (hasErrors) {
    console.log(`${colors.bold}${colors.yellow}💡 Optimization Recommendations${colors.reset}`);
    
    const oversizedBundles = results.filter(r => r.isOverLimit);
    
    oversizedBundles.forEach(bundle => {
      console.log(`\n${colors.yellow}${bundle.file}${colors.reset} (${bundle.bundleType}):`);
      
      if (bundle.bundleType === 'vendor') {
        console.log('  • Consider removing unused dependencies');
        console.log('  • Enable tree-shaking for third-party libraries');
        console.log('  • Split vendor bundle into multiple chunks');
      } else if (bundle.bundleType === 'charts') {
        console.log('  • Implement dynamic imports for chart components');
        console.log('  • Consider using a lighter charting library');
        console.log('  • Load chart components only when needed');
      } else if (bundle.bundleType === 'maps') {
        console.log('  • Lazy load map tiles and features');
        console.log('  • Split map components into smaller chunks');
        console.log('  • Consider using a CDN for map assets');
      } else if (bundle.bundleType === 'main') {
        console.log('  • Implement more aggressive code splitting');
        console.log('  • Move large components to separate chunks');
        console.log('  • Use dynamic imports for non-critical features');
      } else {
        console.log('  • Consider breaking this chunk into smaller pieces');
        console.log('  • Implement lazy loading for large components');
      }
    });

    console.log(`\n${colors.blue}ℹ️  For detailed analysis, run: npm run analyze:open${colors.reset}`);
  }

  // Generate size report
  const report = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeLimit: SIZE_LIMITS.total,
    bundles: results,
    passed: !hasErrors
  };

  const reportPath = path.join(process.cwd(), 'build', 'bundle-size-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Exit with error code if limits exceeded
  if (hasErrors) {
    console.log(`\n${colors.red}❌ Bundle size check failed!${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All bundle sizes are within limits!${colors.reset}`);
  }
}

// Performance timing
const startTime = process.hrtime();

try {
  checkBundleSizes();
} catch (error) {
  console.error(`${colors.red}❌ Error during size check:${colors.reset}`, error);
  process.exit(1);
}

const [seconds, nanoseconds] = process.hrtime(startTime);
const executionTime = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
console.log(`\n⏱️  Analysis completed in ${executionTime}ms`);
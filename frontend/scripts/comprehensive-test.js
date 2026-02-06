#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, stdout, stderr });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
};

// Test results storage
const testResults = {
  build: { passed: false, details: [] },
  typeCheck: { passed: false, details: [] },
  lint: { passed: false, details: [] },
  bundleSize: { passed: false, details: [] },
  seo: { passed: false, details: [] },
  security: { passed: false, details: [] },
  performance: { passed: false, details: [] },
  accessibility: { passed: false, details: [] },
  pwa: { passed: false, details: [] },
};

// 1. BUILD TEST
async function testBuild() {
  log('\n🔨 Testing Build Process...', 'cyan');

  const result = await runCommand('npm run build');

  if (result.success) {
    testResults.build.passed = true;
    testResults.build.details.push('✅ Build completed successfully');

    // Check if build directory exists
    const buildExists = fs.existsSync(path.join(process.cwd(), 'build'));
    if (buildExists) {
      testResults.build.details.push('✅ Build directory created');

      // Check for essential files
      const essentialFiles = [
        'build/index.html',
        'build/manifest.json',
        'build/static/css',
        'build/static/js',
      ];

      essentialFiles.forEach((file) => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          testResults.build.details.push(`✅ ${file} exists`);
        } else {
          testResults.build.details.push(`❌ ${file} missing`);
          testResults.build.passed = false;
        }
      });
    } else {
      testResults.build.passed = false;
      testResults.build.details.push('❌ Build directory not created');
    }
  } else {
    testResults.build.passed = false;
    testResults.build.details.push(`❌ Build failed: ${result.error}`);
  }

  log(
    `Build Test: ${testResults.build.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.build.passed ? 'green' : 'red'
  );
}

// 2. TYPESCRIPT CHECK
async function testTypeScript() {
  log('\n📝 Testing TypeScript Compilation...', 'cyan');

  const result = await runCommand('npx tsc --noEmit');

  if (result.success && !result.stderr.includes('error')) {
    testResults.typeCheck.passed = true;
    testResults.typeCheck.details.push('✅ No TypeScript errors found');
  } else {
    testResults.typeCheck.passed = false;
    const errors = result.stderr
      .split('\n')
      .filter((line) => line.includes('error'));
    testResults.typeCheck.details.push(
      `❌ TypeScript errors found: ${errors.length}`
    );
    errors.slice(0, 5).forEach((error) => {
      testResults.typeCheck.details.push(`   ${error.trim()}`);
    });
  }

  log(
    `TypeScript Test: ${testResults.typeCheck.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.typeCheck.passed ? 'green' : 'red'
  );
}

// 3. LINTING TEST
async function testLinting() {
  log('\n🔍 Testing Code Quality (ESLint)...', 'cyan');

  const result = await runCommand(
    'node ./node_modules/eslint/bin/eslint.js src --ext .ts,.tsx'
  );

  if (result.success) {
    testResults.lint.passed = true;
    testResults.lint.details.push('✅ No linting errors found');
  } else {
    testResults.lint.passed = false;
    const warnings = (result.stdout.match(/warning/g) || []).length;
    const errors = (result.stdout.match(/error/g) || []).length;

    testResults.lint.details.push(
      `❌ ESLint issues found: ${errors} errors, ${warnings} warnings`
    );

    // Get first few issues
    const lines = result.stdout
      .split('\n')
      .filter((line) => line.includes('warning') || line.includes('error'))
      .slice(0, 5);

    lines.forEach((line) => {
      testResults.lint.details.push(`   ${line.trim()}`);
    });
  }

  log(
    `Linting Test: ${testResults.lint.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.lint.passed ? 'green' : 'red'
  );
}

// 4. BUNDLE SIZE TEST
async function testBundleSize() {
  log('\n📦 Testing Bundle Size...', 'cyan');

  const result = await runCommand('node scripts/size-check.js');

  // Parse the output to determine if sizes are within limits
  const output = result.stdout;
  const totalSizeMatch = output.match(/Total gzipped size: ([\d.]+\s*\w+)/);
  const overLimitMatch = output.match(/❌ OVER LIMIT/g);

  if (totalSizeMatch) {
    const totalSize = totalSizeMatch[1];
    testResults.bundleSize.details.push(`📊 Total bundle size: ${totalSize}`);

    if (!overLimitMatch || overLimitMatch.length <= 2) {
      testResults.bundleSize.passed = true;
      testResults.bundleSize.details.push(
        '✅ Bundle sizes within acceptable limits'
      );
    } else {
      testResults.bundleSize.passed = false;
      testResults.bundleSize.details.push(
        `⚠️ ${overLimitMatch.length} bundles over size limits`
      );
    }
  } else {
    testResults.bundleSize.passed = false;
    testResults.bundleSize.details.push('❌ Could not analyze bundle sizes');
  }

  log(
    `Bundle Size Test: ${testResults.bundleSize.passed ? '✅ PASSED' : '⚠️ WARNING'}`,
    testResults.bundleSize.passed ? 'green' : 'yellow'
  );
}

// 5. SEO TEST
async function testSEO() {
  log('\n🔍 Testing SEO Implementation...', 'cyan');

  // Check if SEO files exist
  const seoFiles = [
    'public/robots.txt',
    'public/sitemap.xml',
    'public/manifest.json',
    'src/components/SEO/SEOHead.tsx',
    'src/hooks/useSEO.ts',
  ];

  let seoScore = 0;
  const maxScore = seoFiles.length + 5; // Additional checks

  seoFiles.forEach((file) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      testResults.seo.details.push(`✅ ${file} exists`);
      seoScore++;
    } else {
      testResults.seo.details.push(`❌ ${file} missing`);
    }
  });

  // Check index.html for SEO elements
  const indexPath = path.join(process.cwd(), 'public/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    const seoChecks = [
      {
        check: indexContent.includes('meta name="description"'),
        name: 'Meta description',
      },
      {
        check: indexContent.includes('meta name="keywords"'),
        name: 'Meta keywords',
      },
      { check: indexContent.includes('og:title'), name: 'Open Graph tags' },
      { check: indexContent.includes('twitter:card'), name: 'Twitter Cards' },
      {
        check: indexContent.includes('application/ld+json'),
        name: 'Structured data',
      },
    ];

    seoChecks.forEach(({ check, name }) => {
      if (check) {
        testResults.seo.details.push(`✅ ${name} found`);
        seoScore++;
      } else {
        testResults.seo.details.push(`❌ ${name} missing`);
      }
    });
  }

  testResults.seo.passed = seoScore >= maxScore * 0.8; // 80% threshold
  testResults.seo.details.push(
    `📊 SEO Score: ${seoScore}/${maxScore} (${Math.round((seoScore / maxScore) * 100)}%)`
  );

  log(
    `SEO Test: ${testResults.seo.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.seo.passed ? 'green' : 'red'
  );
}

// 6. SECURITY TEST
async function testSecurity() {
  log('\n🛡️ Testing Security...', 'cyan');

  // Check for security vulnerabilities
  const auditResult = await runCommand('npm audit --audit-level moderate');

  const vulnerabilities = auditResult.stdout.match(/(\d+) vulnerabilities/);
  const highVulns = auditResult.stdout.match(/(\d+) high/);
  const criticalVulns = auditResult.stdout.match(/(\d+) critical/);

  if (!vulnerabilities || vulnerabilities[1] === '0') {
    testResults.security.passed = true;
    testResults.security.details.push('✅ No security vulnerabilities found');
  } else {
    const vulnCount = parseInt(vulnerabilities[1]);
    const highCount = highVulns ? parseInt(highVulns[1]) : 0;
    const criticalCount = criticalVulns ? parseInt(criticalVulns[1]) : 0;

    if (criticalCount > 0) {
      testResults.security.passed = false;
      testResults.security.details.push(
        `🚨 ${criticalCount} critical vulnerabilities found`
      );
    } else if (highCount > 3) {
      testResults.security.passed = false;
      testResults.security.details.push(
        `⚠️ ${highCount} high-severity vulnerabilities found`
      );
    } else {
      testResults.security.passed = true;
      testResults.security.details.push(
        `⚠️ ${vulnCount} vulnerabilities found (acceptable level)`
      );
    }
  }

  // Check for security headers in build
  const indexPath = path.join(process.cwd(), 'public/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    if (indexContent.includes('X-Content-Type-Options')) {
      testResults.security.details.push(
        '✅ X-Content-Type-Options header found'
      );
    } else {
      testResults.security.details.push(
        '⚠️ X-Content-Type-Options header missing'
      );
    }
  }

  log(
    `Security Test: ${testResults.security.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.security.passed ? 'green' : 'red'
  );
}

// 7. PERFORMANCE TEST
async function testPerformance() {
  log('\n⚡ Testing Performance...', 'cyan');

  // Check if service worker exists
  const swPath = path.join(process.cwd(), 'public/sw.js');
  if (fs.existsSync(swPath)) {
    testResults.performance.details.push('✅ Service worker implemented');
  } else {
    testResults.performance.details.push('❌ Service worker missing');
  }

  // Check for lazy loading implementation
  const appPath = path.join(process.cwd(), 'src/App.tsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');

    if (appContent.includes('React.lazy')) {
      testResults.performance.details.push('✅ Code splitting implemented');
    } else {
      testResults.performance.details.push('❌ Code splitting not found');
    }

    if (appContent.includes('Suspense')) {
      testResults.performance.details.push(
        '✅ Suspense boundaries implemented'
      );
    } else {
      testResults.performance.details.push('❌ Suspense boundaries missing');
    }
  }

  // Check for performance optimizations
  const optimizations = [
    { file: 'src/hooks/useRoutePreloader.ts', name: 'Route preloading' },
    { file: 'src/components/LazyChart.tsx', name: 'Lazy chart loading' },
    { file: 'src/components/LazyMap.tsx', name: 'Lazy map loading' },
  ];

  let perfScore = 0;
  optimizations.forEach(({ file, name }) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      testResults.performance.details.push(`✅ ${name} implemented`);
      perfScore++;
    } else {
      testResults.performance.details.push(`❌ ${name} missing`);
    }
  });

  testResults.performance.passed = perfScore >= 2; // At least 2 optimizations
  testResults.performance.details.push(
    `📊 Performance optimizations: ${perfScore}/${optimizations.length}`
  );

  log(
    `Performance Test: ${testResults.performance.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.performance.passed ? 'green' : 'red'
  );
}

// 8. ACCESSIBILITY TEST
async function testAccessibility() {
  log('\n♿ Testing Accessibility...', 'cyan');

  // Check index.html for accessibility features
  const indexPath = path.join(process.cwd(), 'public/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    const a11yChecks = [
      { check: indexContent.includes('lang='), name: 'Language declaration' },
      { check: indexContent.includes('viewport'), name: 'Viewport meta tag' },
      {
        check: indexContent.includes('theme-color'),
        name: 'Theme color for mobile',
      },
    ];

    let a11yScore = 0;
    a11yChecks.forEach(({ check, name }) => {
      if (check) {
        testResults.accessibility.details.push(`✅ ${name} found`);
        a11yScore++;
      } else {
        testResults.accessibility.details.push(`❌ ${name} missing`);
      }
    });

    testResults.accessibility.passed = a11yScore >= 2;
    testResults.accessibility.details.push(
      `📊 Accessibility Score: ${a11yScore}/${a11yChecks.length}`
    );
  } else {
    testResults.accessibility.passed = false;
    testResults.accessibility.details.push(
      '❌ Could not check accessibility features'
    );
  }

  log(
    `Accessibility Test: ${testResults.accessibility.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.accessibility.passed ? 'green' : 'red'
  );
}

// 9. PWA TEST
async function testPWA() {
  log('\n📱 Testing Progressive Web App...', 'cyan');

  const pwaFiles = [
    { file: 'public/manifest.json', name: 'PWA Manifest' },
    { file: 'public/sw.js', name: 'Service Worker' },
  ];

  let pwaScore = 0;
  pwaFiles.forEach(({ file, name }) => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      testResults.pwa.details.push(`✅ ${name} exists`);
      pwaScore++;

      // Check manifest content
      if (file === 'public/manifest.json') {
        try {
          const manifestContent = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const requiredFields = [
            'name',
            'short_name',
            'start_url',
            'display',
            'icons',
          ];
          const hasAllFields = requiredFields.every(
            (field) => manifestContent[field]
          );

          if (hasAllFields) {
            testResults.pwa.details.push('✅ Manifest has all required fields');
            pwaScore++;
          } else {
            testResults.pwa.details.push('⚠️ Manifest missing some fields');
          }
        } catch (error) {
          testResults.pwa.details.push('❌ Manifest JSON is invalid');
        }
      }
    } else {
      testResults.pwa.details.push(`❌ ${name} missing`);
    }
  });

  testResults.pwa.passed = pwaScore >= 2;
  testResults.pwa.details.push(`📊 PWA Score: ${pwaScore}/3`);

  log(
    `PWA Test: ${testResults.pwa.passed ? '✅ PASSED' : '❌ FAILED'}`,
    testResults.pwa.passed ? 'green' : 'red'
  );
}

// GENERATE REPORT
function generateReport() {
  log('\n📊 COMPREHENSIVE TEST REPORT', 'bold');
  log('=====================================', 'blue');

  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(
    (test) => test.passed
  ).length;
  const overallScore = Math.round((passedTests / totalTests) * 100);

  log(
    `\n🎯 OVERALL SCORE: ${overallScore}% (${passedTests}/${totalTests} tests passed)`,
    'bold'
  );

  // Status indicator
  if (overallScore >= 90) {
    log('🏆 EXCELLENT - Website is production ready!', 'green');
  } else if (overallScore >= 75) {
    log('✅ GOOD - Website is mostly ready with minor issues', 'yellow');
  } else {
    log(
      '⚠️ NEEDS IMPROVEMENT - Address critical issues before deployment',
      'red'
    );
  }

  log('\n📋 DETAILED RESULTS:', 'blue');

  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';

    log(`\n${testName.toUpperCase()}: ${status}`, color);
    result.details.forEach((detail) => {
      log(`  ${detail}`, 'reset');
    });
  });

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'yellow');

  if (!testResults.build.passed) {
    log('  🔨 Fix build errors before proceeding', 'red');
  }

  if (!testResults.typeCheck.passed) {
    log('  📝 Resolve TypeScript errors for better code quality', 'yellow');
  }

  if (!testResults.security.passed) {
    log('  🛡️ Address security vulnerabilities immediately', 'red');
  }

  if (!testResults.seo.passed) {
    log(
      '  🔍 Complete SEO implementation for better search rankings',
      'yellow'
    );
  }

  if (!testResults.performance.passed) {
    log(
      '  ⚡ Implement performance optimizations for better user experience',
      'yellow'
    );
  }

  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    overallScore,
    passedTests,
    totalTests,
    results: testResults,
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'test-report.json'),
    JSON.stringify(reportData, null, 2)
  );

  log('\n📄 Detailed report saved to: test-report.json', 'cyan');
  log('\n🚀 Testing complete!', 'green');
}

// MAIN EXECUTION
async function runAllTests() {
  const startTime = Date.now();

  log('🧪 STARTING COMPREHENSIVE WEBSITE TESTING', 'bold');
  log('==========================================', 'blue');

  try {
    await testBuild();
    await testTypeScript();
    await testLinting();
    await testBundleSize();
    await testSEO();
    await testSecurity();
    await testPerformance();
    await testAccessibility();
    await testPWA();

    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`\n⏱️ Tests completed in ${duration} seconds`, 'cyan');

    generateReport();
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();

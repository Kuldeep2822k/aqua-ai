/**
 * Entry point for Render deployment (or other root-based deployments)
 * This redirects to the backend server and fixes module resolution.
 */

const path = require('path');
const Module = require('module');

// 1. Add 'backend/node_modules' to the module search paths
// This ensures require('express') works even though we are running from root
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
const originalNodePath = process.env.NODE_PATH || '';
process.env.NODE_PATH = originalNodePath 
  ? `${backendNodeModules}${path.delimiter}${originalNodePath}`
  : backendNodeModules;

// Refresh the module paths algorithm to recognize the change
require('module').Module._initPaths();

// 2. Change working directory to backend
// This ensures relative paths (like reading .env or database config) work correctly
process.chdir(path.join(__dirname, 'backend'));

console.log('🚀 Starting Aqua-AI Backend from root entry point...');
console.log(`📂 Working Directory: ${process.cwd()}`);

// 3. Start the server
try {
  // require paths are relative to THIS file, not the CWD
  require('./backend/src/server.js');
} catch (err) {
  console.error('❌ Failed to start server from index.js:', err);
  process.exit(1);
}

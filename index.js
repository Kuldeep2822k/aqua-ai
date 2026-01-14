/**
 * Entry point for Render deployment (or other root-based deployments)
 * This redirects to the backend server.
 */

const path = require('path');

// Change working directory to backend so that relative paths (like .env, database/) work correctly
process.chdir(path.join(__dirname, 'backend'));

// Start the server
// Note: require() paths are relative to the file location (this file),
// but we want to run the server code which is in ./backend/src/server.js.
require('./backend/src/server.js');

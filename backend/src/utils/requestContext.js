const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function runWithRequestId(requestId, fn) {
  storage.run({ requestId }, fn);
}

function getRequestId() {
  return storage.getStore()?.requestId;
}

module.exports = {
  runWithRequestId,
  getRequestId,
};

const path = require('path');

module.exports = {
  // Install Chromium inside backend/puppeteer-cache so electron-builder can bundle it.
  cacheDirectory: path.join(__dirname, 'puppeteer-cache'),
};

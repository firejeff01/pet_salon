const path = require('path');
const fs = require('fs');
const express = require('express');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

function serveFrontend() {
  const distDir = process.env.FRONTEND_DIST_DIR
    || path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (!fs.existsSync(distDir)) {
    return;
  }

  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

serveFrontend();

function start() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Pet Salon backend listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };

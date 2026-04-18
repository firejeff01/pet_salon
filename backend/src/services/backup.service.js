const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { getDataFilePath } = require('../utils/json-store');

let dataDir = path.dirname(getDataFilePath('dummy'));
let backupDir = path.join(dataDir, '..', 'backups');

function _setDirs(newDataDir, newBackupDir) {
  dataDir = newDataDir;
  backupDir = newBackupDir;
}

function formatTimestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}${s}`;
}

async function backup() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = formatTimestamp();
  const filename = `backup_${timestamp}.zip`;
  const backupPath = path.join(backupDir, filename);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({ backupPath, size: archive.pointer() });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all JSON files from data directory
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        archive.file(path.join(dataDir, file), { name: file });
      }
    }

    archive.finalize();
  });
}

async function listBackups() {
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const stats = fs.statSync(path.join(backupDir, f));
      // Extract timestamp from filename: backup_YYYYMMDD_HHmmss.zip
      const match = f.match(/backup_(\d{8}_\d{6})\.zip/);
      const timestamp = match ? match[1] : '';
      return {
        fileName: f,
        timestamp,
        size: stats.size,
      };
    });

  return files;
}

module.exports = { backup, listBackups, _setDirs };

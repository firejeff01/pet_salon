const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_DATA_DIR = process.env.NODE_ENV === 'test'
  ? fs.mkdtempSync(path.join(os.tmpdir(), 'pet-salon-test-'))
  : (process.env.PET_SALON_DATA_DIR || path.join(__dirname, '..', '..', 'data'));

function getDataFilePath(filename) {
  return path.join(DEFAULT_DATA_DIR, filename);
}

async function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    const defaultData = { data: [] };
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`JSON 檔案格式錯誤: ${filePath} - ${err.message}`);
  }
}

async function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.promises.rename(tmpPath, filePath);
}

module.exports = { readJsonFile, writeJsonFile, getDataFilePath };

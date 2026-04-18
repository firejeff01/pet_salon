const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');

const isDev = !app.isPackaged;

function resolveDataDir() {
  if (process.env.PET_SALON_DATA_DIR) return process.env.PET_SALON_DATA_DIR;
  // Store app data under AppData\Roaming (Electron's userData path).
  // Customers can't accidentally delete it from Desktop, and Windows won't
  // sync or relocate it under OneDrive.
  return path.join(app.getPath('userData'), 'data');
}

function legacyDesktopDataDir() {
  return path.join(app.getPath('desktop'), '貳寶寵物美容工坊資料');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

// One-time migration: if the old Desktop data folder exists AND the new
// userData/data folder is empty (or missing), move everything over so existing
// customers don't lose their owners/pets/appointments JSON after upgrade.
function migrateLegacyData(newDir) {
  try {
    const legacy = legacyDesktopDataDir();
    if (!fs.existsSync(legacy)) return;
    const newDirExistsAndNotEmpty =
      fs.existsSync(newDir) && fs.readdirSync(newDir).length > 0;
    if (newDirExistsAndNotEmpty) {
      log(`migration skipped: new dir already populated (${newDir})`);
      return;
    }
    log(`migrating legacy data: ${legacy}  ->  ${newDir}`);
    copyDirRecursive(legacy, newDir);
    // Rename the legacy folder so we don't re-migrate on next launch but still
    // preserve a backup in case something went wrong.
    const backup = `${legacy}.migrated-${Date.now()}`;
    fs.renameSync(legacy, backup);
    log(`legacy data archived to ${backup}`);
  } catch (err) {
    log(`migration failed: ${err.message}`);
  }
}

function getLogPath() {
  const dir = app.getPath('userData');
  ensureDir(dir);
  return path.join(dir, 'startup.log');
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(getLogPath(), line); } catch (_) {}
  try { process.stdout.write(line); } catch (_) {}
}

async function startBackend() {
  const dataDir = resolveDataDir();

  log(`app.isPackaged = ${app.isPackaged}`);
  log(`app.getPath('home')    = ${app.getPath('home')}`);
  log(`app.getPath('userData')= ${app.getPath('userData')}`);
  log(`resolved dataDir       = ${dataDir}`);

  ensureDir(dataDir);
  migrateLegacyData(dataDir);

  try {
    const probe = path.join(dataDir, '.write-test');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    log(`dataDir is writable`);
  } catch (err) {
    log(`dataDir is NOT writable: ${err.message}`);
    throw new Error(`無法寫入資料夾：${dataDir}\n${err.message}`);
  }

  process.env.PET_SALON_DATA_DIR = dataDir;
  process.env.PORT = process.env.PORT || '3000';

  let backendEntry;
  if (isDev) {
    process.env.FRONTEND_DIST_DIR = process.env.FRONTEND_DIST_DIR
      || path.join(__dirname, '..', 'frontend', 'dist');
    backendEntry = path.join(__dirname, '..', 'backend', 'src', 'index.js');
  } else {
    process.env.FRONTEND_DIST_DIR = path.join(process.resourcesPath, 'frontend', 'dist');
    backendEntry = path.join(process.resourcesPath, 'backend', 'src', 'index.js');
  }

  log(`loading backend from ${backendEntry}`);
  const backend = require(backendEntry);
  await backend.start();
  log(`backend up on http://localhost:${process.env.PORT}`);
  return `http://localhost:${process.env.PORT}`;
}

function buildMenu(dataDir) {
  const template = [
    {
      label: '檔案',
      submenu: [
        {
          label: '開啟資料夾',
          click: () => shell.openPath(dataDir),
        },
        {
          label: '開啟啟動日誌',
          click: () => shell.openPath(getLogPath()),
        },
        { type: 'separator' },
        { role: 'quit', label: '離開' },
      ],
    },
    {
      label: '檢視',
      submenu: [
        { role: 'reload', label: '重新載入' },
        { role: 'toggleDevTools', label: '開發者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '實際大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全螢幕' },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

function createWindow(url, dataDir) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: '貳寶寵物美容工坊',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(buildMenu(dataDir));
  win.loadURL(url);

  win.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: 'deny' };
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  try {
    const url = await startBackend();
    createWindow(url, process.env.PET_SALON_DATA_DIR);
  } catch (err) {
    log(`FATAL: ${err.stack || err}`);
    dialog.showErrorBox('啟動失敗', String(err && err.stack || err));
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && process.env.PORT) {
      createWindow(`http://localhost:${process.env.PORT}`, process.env.PET_SALON_DATA_DIR);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

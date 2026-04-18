const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const BASELINE_DIR = path.join(__dirname, 'baseline');
const RENDER_SCRIPT = path.join(__dirname, 'render-pages.js');

// Render every page of a PDF buffer into PNGs by spawning a subprocess that
// runs pdf-to-img.  Returns an array of Buffers, one per page.
function pdfPagesToPngBuffers(pdfBuffer, scale = 2) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-vrt-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);
  const outDir = path.join(tmpDir, 'pages');
  execFileSync(process.execPath, [RENDER_SCRIPT, pdfPath, outDir, String(scale)], {
    stdio: 'pipe',
  });
  const pages = [];
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const file = path.join(outDir, `page-${i}.png`);
    if (!fs.existsSync(file)) break;
    pages.push(fs.readFileSync(file));
    i++;
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return pages;
}

function baselinePath(pageNumber) {
  return path.join(BASELINE_DIR, `page-${pageNumber}.png`);
}

function diffPath(pageNumber) {
  return path.join(BASELINE_DIR, `page-${pageNumber}.diff.png`);
}

function ensureBaselineDir() {
  if (!fs.existsSync(BASELINE_DIR)) fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

module.exports = { pdfPagesToPngBuffers, baselinePath, diffPath, ensureBaselineDir };

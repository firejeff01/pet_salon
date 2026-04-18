// Regenerate baseline PNGs from the current pdf-generator output.
// Run this whenever the contract template or fixtures change intentionally:
//   node tests/pdf-generator/update-baseline.js
const fs = require('fs');
const { generatePdf, closeBrowser } = require('../../src/pdf-generator');
const { pdfPagesToPngBuffers, baselinePath, ensureBaselineDir } = require('./helpers');
const fixture = require('./fixtures');

(async () => {
  ensureBaselineDir();
  const pdfBuffer = await generatePdf(fixture);
  const pngs = pdfPagesToPngBuffers(pdfBuffer);
  pngs.forEach((buf, idx) => {
    const out = baselinePath(idx + 1);
    fs.writeFileSync(out, buf);
    console.log(`Wrote ${out} (${buf.length} bytes)`);
  });
  await closeBrowser();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

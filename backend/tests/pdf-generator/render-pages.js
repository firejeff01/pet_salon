// Standalone renderer used by baseline generation and visual regression tests.
// pdf-to-img is ESM-only; running it through a subprocess avoids Jest's
// CommonJS transform pipeline interfering with the `import` statements.
//
// Usage:  node render-pages.js <pdf-path> <out-dir> [scale]
const fs = require('fs');
const path = require('path');

(async () => {
  const [, , pdfPath, outDir, scaleArg] = process.argv;
  if (!pdfPath || !outDir) {
    console.error('Usage: node render-pages.js <pdf-path> <out-dir> [scale]');
    process.exit(2);
  }
  const scale = Number(scaleArg) || 2;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const { pdf } = await import('pdf-to-img');
  const doc = await pdf(pdfPath, { scale });
  let i = 1;
  for await (const pageBuf of doc) {
    const out = path.join(outDir, `page-${i}.png`);
    fs.writeFileSync(out, pageBuf);
    i++;
  }
  console.log(`Rendered ${i - 1} pages to ${outDir}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

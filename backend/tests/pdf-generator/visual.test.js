// Visual regression test for the generated PDF.
// Compares each rendered page against tests/pdf-generator/baseline/page-{N}.png.
// If the baseline drifts intentionally (template/fixture change), regenerate
// via `node tests/pdf-generator/update-baseline.js`.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { generatePdf, closeBrowser } = require('../../src/pdf-generator');
const { pdfPagesToPngBuffers, baselinePath, diffPath } = require('./helpers');
const fixture = require('./fixtures');

jest.setTimeout(90000);

// Fraction of pixels allowed to differ.  0.005 = 0.5%.  Slight anti-aliasing
// drift around text glyphs is expected between Chromium versions.
const DIFF_THRESHOLD = 0.005;

function loadPng(buffer) {
  return PNG.sync.read(buffer);
}

// Baselines are PNGs rendered with a specific Chromium version on Windows.
// Running the same template on macOS/Linux CI produces tiny anti-aliasing
// differences that exceed the 0.5% threshold.  CI skips these tests; run
// locally on the machine that owns the baselines.
const describeOrSkip = process.env.CI ? describe.skip : describe;

describeOrSkip('pdf-generator visual regression', () => {
  let pngs;

  beforeAll(async () => {
    const pdfBuffer = await generatePdf(fixture);
    pngs = pdfPagesToPngBuffers(pdfBuffer);
  });

  afterAll(async () => {
    await closeBrowser();
  });

  test('renders 4 pages', () => {
    expect(pngs).toHaveLength(4);
  });

  [1, 2, 3, 4].forEach((pageNum) => {
    test(`page ${pageNum} matches baseline within ${DIFF_THRESHOLD * 100}% pixels`, () => {
      const base = baselinePath(pageNum);
      if (!fs.existsSync(base)) {
        throw new Error(
          `Baseline missing: ${base}\nRun \`node tests/pdf-generator/update-baseline.js\` to generate baselines before running visual tests.`,
        );
      }
      const actual = loadPng(pngs[pageNum - 1]);
      const expected = loadPng(fs.readFileSync(base));
      expect(actual.width).toBe(expected.width);
      expect(actual.height).toBe(expected.height);

      const { width, height } = actual;
      const diff = new PNG({ width, height });
      const diffPixels = pixelmatch(
        expected.data,
        actual.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 },
      );
      const totalPixels = width * height;
      const diffRatio = diffPixels / totalPixels;

      if (diffRatio > DIFF_THRESHOLD) {
        // Persist diff image to help you eyeball what changed.
        fs.writeFileSync(diffPath(pageNum), PNG.sync.write(diff));
        throw new Error(
          `Page ${pageNum} differs by ${(diffRatio * 100).toFixed(3)}% (${diffPixels}/${totalPixels} px).\n` +
          `Diff image: ${diffPath(pageNum)}\n` +
          `If the change is intentional, run update-baseline.js to refresh.`,
        );
      }
    });
  });
});

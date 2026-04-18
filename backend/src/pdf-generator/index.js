const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'contract.hbs');
const DEFAULT_FONT_PATH = path.join(__dirname, '..', '..', 'assets', 'kaiu.ttf');

registerHelpers();

let compiledTemplate = null;
let cachedFontDataUri = null;
let browserPromise = null;

function registerHelpers() {
  Handlebars.registerHelper('ifEq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
  Handlebars.registerHelper('includes', function (arr, value, options) {
    return Array.isArray(arr) && arr.includes(value) ? options.fn(this) : options.inverse(this);
  });
}

function loadTemplate() {
  if (!compiledTemplate) {
    const src = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    compiledTemplate = Handlebars.compile(src);
  }
  return compiledTemplate;
}

function loadFontDataUri(customFontPath) {
  if (customFontPath) {
    const bytes = fs.readFileSync(customFontPath);
    return `data:font/ttf;base64,${bytes.toString('base64')}`;
  }
  if (!cachedFontDataUri) {
    if (!fs.existsSync(DEFAULT_FONT_PATH)) return '';
    const bytes = fs.readFileSync(DEFAULT_FONT_PATH);
    cachedFontDataUri = `data:font/ttf;base64,${bytes.toString('base64')}`;
  }
  return cachedFontDataUri;
}

function parseRocDate(rocStr) {
  if (!rocStr) return { year: '', month: '', day: '' };
  const m = rocStr.match(/(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!m) return { year: '', month: '', day: '' };
  return { year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) };
}

function priceOf(record, item) {
  if (!record || !record.services) return '';
  const found = record.services.find((s) => (s.item || s.type) === item);
  if (!found) return '';
  return String(found.price || 0);
}

function hasService(record, item) {
  if (!record || !record.services) return false;
  return record.services.some((s) => (s.item || s.type) === item);
}

function buildViewModel(contractData) {
  const { owner = {}, pet = {}, record = {}, hospital = {}, rocDate } = contractData;
  const { year, month, day } = parseRocDate(rocDate);

  const hospitalLine = hospital.name && hospital.name !== '安欣動物醫院'
    ? `${hospital.name}${hospital.phone ? ' / ' + hospital.phone : ''}${hospital.address ? ' / ' + hospital.address : ''}`
    : '';

  return {
    owner,
    pet,
    record,
    hospital,
    rocYear: year,
    rocMonth: month,
    rocDay: day,
    has洗澡: hasService(record, '洗澡'),
    has美容: hasService(record, '美容'),
    has其他: hasService(record, '其他'),
    price洗澡: priceOf(record, '洗澡'),
    price美容: priceOf(record, '美容'),
    price其他: priceOf(record, '其他'),
    ownerPreferredHospitalLine: hospitalLine,
    hospitalTarget: owner.preferredAnimalHospital ? '飼主' : '店家',
    storedValueDisplay: owner.isStoredValueCustomer
      ? String(owner.storedValueBalance || 0)
      : '',
  };
}

function resolveChromiumExecutable() {
  // When packaged via electron-builder, puppeteer-cache/ lives next to the
  // backend/ root.  Puppeteer's cache layout is:
  //   chrome/win64-<ver>/chrome-win64/chrome.exe
  //   chrome/mac-<ver>/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
  //   chrome/mac_arm64-<ver>/chrome-mac-arm64/...
  //   chrome/linux-<ver>/chrome-linux64/chrome
  const cacheDir = path.join(__dirname, '..', '..', 'puppeteer-cache', 'chrome');
  if (!fs.existsSync(cacheDir)) return undefined;
  const versions = fs.readdirSync(cacheDir).filter((d) =>
    d.startsWith('win64-') || d.startsWith('mac-') || d.startsWith('mac_arm64-') || d.startsWith('linux-')
  );
  for (const v of versions) {
    const candidates = [
      path.join(cacheDir, v, 'chrome-win64', 'chrome.exe'),
      path.join(cacheDir, v, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      path.join(cacheDir, v, 'chrome-mac-x64',   'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      path.join(cacheDir, v, 'chrome-linux64', 'chrome'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  return undefined;
}

async function getBrowser() {
  if (!browserPromise) {
    const executablePath = resolveChromiumExecutable();
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(executablePath ? { executablePath } : {}),
    });
  }
  return browserPromise;
}

async function renderToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // domcontentloaded is enough because the template embeds the font as a
    // data URI and pulls no external assets. networkidle0 + the default
    // 30s timeout is too tight for cold Chromium starts on CI runners.
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

async function generatePdf(contractData, options = {}) {
  const template = loadTemplate();
  const fontDataUri = loadFontDataUri(options.fontPath);
  const view = buildViewModel(contractData);
  const html = template({ ...view, fontDataUri });
  return renderToPdf(html);
}

async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

module.exports = { generatePdf, closeBrowser };

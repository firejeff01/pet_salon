const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico').default;

const dir = __dirname;
const sizes = [256, 128, 64, 48, 32, 16];
const sources = sizes.map(s => path.join(dir, `icon-${s}.png`));

for (const p of sources) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing ${p}. Run make-icon.ps1 first.`);
  }
}

pngToIco(sources).then((buf) => {
  const out = path.join(dir, 'icon.ico');
  fs.writeFileSync(out, buf);
  console.log(`Wrote ${out} (${buf.length} bytes)`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

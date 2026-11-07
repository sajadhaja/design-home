import puppeteer from 'puppeteer-core';
const views = process.argv.slice(3);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
p.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text()); }); p.on('pageerror', (e) => console.log('PAGEERR', e.message));
for (const v of views) {
  await p.goto('file://' + process.argv[2] + '?view=' + v, { waitUntil: 'load' });
  await p.waitForFunction('window.__ready===true', { timeout: 60000 }); await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: `/tmp/m3d/shot_${v}.png` }); console.log('ok', v);
}
await b.close();

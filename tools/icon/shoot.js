const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 2048, height: 2048 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/render.html');
  await p.waitForFunction(() => window.done === true, null, { timeout: 240000 });
  const r = await p.evaluate(() => window.renders);
  for (const k of Object.keys(r)) fs.writeFileSync(process.argv[2] + '/' + k + '.png', Buffer.from(r[k].split(',')[1], 'base64'));
  console.log('ok', Object.keys(r), errs.slice(0, 3));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });

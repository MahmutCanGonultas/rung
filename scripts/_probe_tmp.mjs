import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = '.sample-line:hover { background: var(--surface-2); }';
const CANCEL = '.trial-pane .sample-line:hover { background: none; }';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });

async function scenario({ media, insertBase, insertCancel, hoverTarget }) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  if (media) { const c = await page.createCDPSession(); await c.send('Emulation.setEmulatedMedia', { features: media }); }
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.trial-pane.is-broken .sample-finding');

  // inject the two rules at their original cascade positions, BEFORE hovering
  await page.evaluate((BASE, CANCEL, insertBase, insertCancel) => {
    const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('.css'));
    const idx = sel => { for (let i = 0; i < sheet.cssRules.length; i++) if (sheet.cssRules[i].selectorText === sel) return i; return -1; };
    if (insertBase) sheet.insertRule(BASE, idx('.sample-line::-webkit-details-marker') + 1);
    if (insertCancel) sheet.insertRule(CANCEL, idx('.trial-pane .sample-line') + 1);
  }, BASE, CANCEL, insertBase, insertCancel);

  // scroll the pane into view, then WAIT for every animation to finish
  await page.evaluate(() => document.querySelector('.trial-pane.is-broken').scrollIntoView({ block: 'center' }));
  await sleep(500);
  await page.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  await sleep(400);

  const el = await page.evaluateHandle((hoverTarget) => {
    const pane = document.querySelector('.trial-pane.is-broken');
    const fs = [...pane.querySelectorAll('.sample-finding')];
    const t = hoverTarget === 'open' ? fs.find(f => f.open) : fs.find(f => !f.open);
    return t.querySelector('.sample-line');
  }, hoverTarget);
  await el.asElement().hover();
  await sleep(450);

  const m = await page.evaluate((hoverTarget) => {
    const pane = document.querySelector('.trial-pane.is-broken');
    const fs = [...pane.querySelectorAll('.sample-finding')];
    const t = hoverTarget === 'open' ? fs.find(f => f.open) : fs.find(f => !f.open);
    const g = e => e ? getComputedStyle(e).backgroundColor : null;
    const r = t.getBoundingClientRect();
    return {
      hovering: t.matches(':hover'),
      details: g(t), summary: g(t.querySelector('.sample-line')), why: g(t.querySelector('.sample-why')),
      clip: getComputedStyle(t).clipPath,
      box: { x: Math.floor(r.x) - 8, y: Math.floor(r.y) - 8, width: Math.ceil(r.width) + 16, height: Math.ceil(r.height) + 16 },
    };
  }, hoverTarget);
  const shot = await page.screenshot({ clip: m.box, encoding: 'base64' });
  await page.close();
  return { m, shot };
}

async function diff(a, b) {
  const p = await browser.newPage();
  const r = await p.evaluate(async (a, b) => {
    const load = d => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: [ia.width, ia.height, ib.width, ib.height] };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0, max = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i]-db[i]), Math.abs(da[i+1]-db[i+1]), Math.abs(da[i+2]-db[i+2]));
      if (d > 1) n++; if (d > max) max = d;
    }
    return { differingPx: n, totalPx: da.length/4, maxDelta: max, size: [ia.width, ia.height] };
  }, a, b);
  await p.close();
  return r;
}

const DESK = [{ name: 'hover', value: 'hover' }, { name: 'pointer', value: 'fine' }, { name: 'any-hover', value: 'hover' }];
const TOUCH = [{ name: 'hover', value: 'none' }, { name: 'pointer', value: 'coarse' }, { name: 'any-hover', value: 'none' }];

for (const [name, media] of [['DESKTOP hover:hover', DESK], ['TOUCH hover:none', TOUCH]]) {
  console.log('\n================= ' + name + ' =================');
  const ship = await scenario({ media, insertBase: false, insertCancel: false, hoverTarget: 'closed' });
  const withC = await scenario({ media, insertBase: true, insertCancel: true, hoverTarget: 'closed' });
  const noC  = await scenario({ media, insertBase: true, insertCancel: false, hoverTarget: 'closed' });
  console.log('shipped now (no hover rules at all): ', JSON.stringify(ship.m));
  console.log('A base+cancel (state as reported)  : ', JSON.stringify(withC.m));
  console.log('B base only  (cancel deleted)      : ', JSON.stringify(noC.m));
  console.log('PIXEL DIFF A vs B (closed row):', JSON.stringify(await diff(withC.shot, noC.shot)));
  console.log('PIXEL DIFF shipped vs A       :', JSON.stringify(await diff(ship.shot, withC.shot)));

  const openA = await scenario({ media, insertBase: true, insertCancel: true, hoverTarget: 'open' });
  const openB = await scenario({ media, insertBase: true, insertCancel: false, hoverTarget: 'open' });
  console.log('OPEN row, A base+cancel :', JSON.stringify(openA.m));
  console.log('OPEN row, B cancel gone :', JSON.stringify(openB.m));
  console.log('PIXEL DIFF A vs B (open row):', JSON.stringify(await diff(openA.shot, openB.shot)));
}
await browser.close();

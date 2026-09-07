// _w1800_sslab_fill3.mjs — startupslab 收口3: 填表+Save+报错全文+reload复验+LaunchPlan选期(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const EDIT = 'https://startupslab.site/my-products/edit/generator-for-house';

const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });

const shot = async (name) => {
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(`${OUT}/_w1800_sslab_${name}.jpg`, Buffer.from(s.data, 'base64'));
};
const realClick = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
};
const FEATS = [
  'Free exterior design calculator with instant cost estimates',
  'Real project cost data by region and material type',
  'Style suggestions for facades, roofs, and outdoor spaces',
  'Works on mobile, no signup required',
  'Independent budgeting tips from real build data',
];

await c.goto(EDIT, 30000);
await sleep(4000);

// 1. Category
const catTrig = await c.eval(`(() => {
  const t = [...document.querySelectorAll('[role=combobox]')].find(e => (e.innerText || '').includes('Select a category'));
  if (!t) return 'no-el'; t.scrollIntoView({ block: 'center' });
  const r = t.getBoundingClientRect(); return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
if (catTrig.includes(',')) {
  const [x, y] = catTrig.split(',').map(Number);
  await realClick(x, y); await sleep(700);
  const opt = await c.eval(`(() => {
    const os = [...document.querySelectorAll('[role=option],li,[cmdk-item]')].filter(e => e.offsetParent !== null && (e.innerText || '').trim() === 'AI & Machine Learning');
    if (!os.length) return 'no-opt';
    const e = os[0]; const r = e.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (opt.includes(',')) { const [x, y] = opt.split(',').map(Number); await realClick(x, y); await sleep(500); }
  else console.log('CAT_OPT:', opt);
}
console.log('CAT:', await c.eval(`[...document.querySelectorAll('select')].map(x=>x.value).join(',')`));

// 2. Features + firstComment (native setter + input)
await c.eval(`(() => {
  const feats = ${JSON.stringify(FEATS)};
  for (let i = 0; i < feats.length; i++) {
    const e = document.querySelector('[name="features.' + i + '.value"]');
    if (!e) continue;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(e, feats[i]);
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const fc = document.querySelector('[name="firstComment"]');
  if (fc) {
    const s2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    s2.call(fc, 'We built this because exterior renovation quotes are all over the place. Generator For House gives you a free, data-backed estimate before you talk to any contractor. Feedback welcome!');
    fc.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return 'filled';
})()`);
await sleep(300);

// 3. Save 真点击
const saveBtn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText || '').trim() === 'Save Changes');
  if (!b) return 'no-btn'; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('SAVE_BTN:', saveBtn);
if (saveBtn.includes(',')) { const [x, y] = saveBtn.split(',').map(Number); await realClick(x, y); }
await sleep(3500);

// 4. 全文找报错
const body = await c.eval(`document.body.innerText.replace(/\\s+/g, ' ')`);
const errIdx = body.search(/required|invalid|must be|error|failed|at least/i);
console.log('BODY_LEN:', body.length, 'ERR_HIT:', errIdx >= 0 ? body.slice(Math.max(0, errIdx - 60), errIdx + 120) : 'none');
console.log('BODY_TAIL:', body.slice(-500));
await shot('fill3_save');

// 5. reload 复验
await c.goto(EDIT, 30000);
await sleep(4000);
const re = await c.eval(`(() => {
  const cb = [...document.querySelectorAll('[role=combobox]')].map(e => e.innerText.trim().replace(/\\s+/g, ' ').slice(0, 40));
  const fl = [];
  for (let i = 0; i < 6; i++) { const e = document.querySelector('[name="features.' + i + '.value"]'); if (e) fl.push(String(e.value || '').length); }
  const fc = (document.querySelector('[name="firstComment"]') || {}).value || '';
  return JSON.stringify({ cb, featLens: fl, fcLen: fc.length });
})()`);
console.log('RECHECK:', re);

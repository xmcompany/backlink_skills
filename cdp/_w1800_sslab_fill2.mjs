// _w1800_sslab_fill2.mjs — startupslab 收口2.0: 填表+React state探针+Save+同脚本reload复验(win1800)
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
await c.goto(EDIT, 30000);
await sleep(4000);

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

// Save 按钮 disabled 探针
const saveProbe = () => c.eval(`(() => {
  const bs = [...document.querySelectorAll('button')].filter(b => (b.innerText || '').trim() === 'Save Changes');
  if (!bs.length) return 'no-btn';
  const b = bs[0];
  return JSON.stringify({ disabled: b.disabled || b.getAttribute('aria-disabled') || 'false', cls: (b.className || '').includes('disabled') });
})()`);

// ── 1. Category 真点击
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
console.log('CAT_AFTER:', await c.eval(`(() => { const s = [...document.querySelectorAll('select')].map(x => x.value).join(','); const cb = [...document.querySelectorAll('[role=combobox]')][0].innerText.trim(); return JSON.stringify({ selVals: s, cbText: cb }); })()`));
console.log('SAVE_PROBE_AFTER_CAT:', await saveProbe());

// ── 2. Features: native setter + input 事件(React受控标准法) 再 insertText 兜底
const FEATS = [
  'Free exterior design calculator with instant cost estimates',
  'Real project cost data by region and material type',
  'Style suggestions for facades, roofs, and outdoor spaces',
  'Works on mobile, no signup required',
  'Independent budgeting tips from real build data',
];
for (let i = 0; i < FEATS.length; i++) {
  const st = await c.eval(`(() => {
    let e = document.querySelector('[name="features.${i}.value"]');
    if (!e) return 'no-el';
    if (e.offsetParent === null) return 'hidden';
    e.scrollIntoView({ block: 'center' });
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(e, ${JSON.stringify(FEATS[i])});
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    e.focus();
    return 'setter-ok:' + String(e.value).slice(0, 20);
  })()`);
  if (st.startsWith('setter-ok')) {
    await sleep(200);
    const v = await c.eval(`(document.querySelector('[name="features.${i}.value"]')||{}).value||''`);
    console.log(`FEAT${i}: ${v.length > 10 ? 'OK' : 'EMPTY->fallback'}`);
    if (v.length < 10) { await c.send('Input.insertText', { text: FEATS[i] }); await sleep(200); }
  } else console.log(`FEAT${i}:`, st);
}
console.log('SAVE_PROBE_AFTER_FEATS:', await saveProbe());

// ── 3. firstComment
await c.eval(`(() => {
  const e = document.querySelector('[name="firstComment"]'); if (!e) return;
  e.scrollIntoView({ block: 'center' });
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(e, 'We built this because exterior renovation quotes are all over the place. Generator For House gives you a free, data-backed estimate before you talk to any contractor. Feedback welcome!');
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.focus();
})()`);
await sleep(200);

// ── 4. Save Changes 真点击 + 网络观察
await c.send('Network.enable');
let savePost = '';
c.on('Network.responseReceived', (p) => {
  const u = (p.response && p.response.url) || '';
  if (/api|product|save/i.test(u) && p.response.status >= 200) savePost += `\n  ${p.response.status} ${u.slice(0, 110)}`;
});
console.log('SAVE_PROBE_PRE_CLICK:', await saveProbe());
const saveBtn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText || '').trim() === 'Save Changes');
  if (!b) return 'no-btn'; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), disabled: b.disabled });
})()`);
console.log('SAVE_BTN:', saveBtn);
const sb = JSON.parse(saveBtn);
if (!sb.disabled) { await realClick(sb.x, sb.y); await sleep(3500); }
console.log('SAVE_NETWORK:', savePost || '(no api response captured)');
console.log('AFTER_SAVE_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400)`));
await shot('fill2_saved');

// ── 5. 同脚本 reload 复验
await c.goto(EDIT, 30000);
await sleep(4000);
console.log('RECHECK:', await c.eval(`(() => {
  const cb = [...document.querySelectorAll('[role=combobox]')].map(e => e.innerText.trim().replace(/\\s+/g, ' ').slice(0, 50));
  const feats = [];
  for (let i = 0; i < 6; i++) { const e = document.querySelector('[name="features.' + i + '.value"]'); if (e) feats.push(String(e.value || '').length); }
  return JSON.stringify({ cb, featLens: feats });
})()`));

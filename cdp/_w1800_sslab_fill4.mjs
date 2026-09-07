// _w1800_sslab_fill4.mjs — startupslab 收口4: 攻Platforms必填+Save(win1800)
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

// 2. Platforms: 真点trigger → 长等 → dump全部可见短文本项 → 点Web → 键盘兜底
const platTrig = await c.eval(`(() => {
  const t = [...document.querySelectorAll('[role=combobox]')].find(e => (e.innerText || '').includes('Select platforms'));
  if (!t) return 'no-el'; t.scrollIntoView({ block: 'center' });
  const r = t.getBoundingClientRect(); return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('PLAT_TRIG:', platTrig);
if (platTrig.includes(',')) {
  const [x, y] = platTrig.split(',').map(Number);
  await realClick(x, y);
  await sleep(1500);
  const cand = await c.eval(`(() => {
    const out = [];
    for (const e of document.querySelectorAll('[role=option],[cmdk-item],li,label,div[role=checkbox],button')) {
      if (e.offsetParent === null) continue;
      const t = (e.innerText || '').trim().replace(/\\s+/g, ' ');
      if (!t || t.length > 25) continue;
      const r = e.getBoundingClientRect();
      out.push(t + '@' + Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2));
    }
    return [...new Set(out)].slice(0, 25);
  })()`);
  console.log('PLAT_CANDS:', JSON.stringify(cand));
  const web = cand.find(s => /^Web(@|$)/.test(s) || /^Web\b/.test(s));
  if (web) {
    const m = web.match(/@(\d+),(\d+)$/);
    await realClick(Number(m[1]), Number(m[2]));
    await sleep(600);
  } else {
    console.log('PLAT: 键盘兜底 ArrowDown+Enter');
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await sleep(300);
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(500);
  }
  // 关闭可能仍开着的弹层
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(300);
}
console.log('PLAT_STATE:', await c.eval(`(() => { const cb=[...document.querySelectorAll('[role=combobox]')].map(e=>e.innerText.trim().replace(/\\s+/g,' ').slice(0,50)); return JSON.stringify(cb); })()`));

// 3. Features + firstComment
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

// 4. Save
const saveBtn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => (x.innerText || '').trim() === 'Save Changes');
  if (!b) return 'no-btn'; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('SAVE_BTN:', saveBtn);
if (saveBtn.includes(',')) { const [x, y] = saveBtn.split(',').map(Number); await realClick(x, y); }
await sleep(3500);

const body = await c.eval(`document.body.innerText.replace(/\\s+/g, ' ')`);
const errIdx = body.search(/required|invalid|must be|failed|at least/i);
console.log('ERR:', errIdx >= 0 ? body.slice(Math.max(0, errIdx - 50), errIdx + 100) : 'none');
console.log('URL_NOW:', await c.eval('location.href'));
await shot('fill4_save');

// 5. reload 复验
await c.goto(EDIT, 30000);
await sleep(4000);
console.log('RECHECK:', await c.eval(`(() => {
  const cb = [...document.querySelectorAll('[role=combobox]')].map(e => e.innerText.trim().replace(/\\s+/g, ' ').slice(0, 40));
  const fl = [];
  for (let i = 0; i < 6; i++) { const e = document.querySelector('[name="features.' + i + '.value"]'); if (e) fl.push(String(e.value || '').length); }
  return JSON.stringify({ cb, featLens: fl });
})()`));

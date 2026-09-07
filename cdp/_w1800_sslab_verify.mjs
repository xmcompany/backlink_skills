// _w1800_sslab_verify.mjs — reload 验证持久化 + Launch Plan dump(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const EDIT = process.argv[2] || 'https://startupslab.site/my-products/edit/generator-for-house';

const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await c.goto(EDIT, 30000);
await sleep(4500);

// 持久化验证
const state = await c.eval(`(() => {
  const cb = [...document.querySelectorAll('[role=combobox]')].map(e => e.innerText.trim().replace(/\\s+/g, ' ').slice(0, 60));
  const feats = [];
  for (let i = 0; i < 8; i++) { const e = document.querySelector('[name="features.' + i + '.value"]'); if (e) feats.push(String(e.value || '').slice(0, 40)); }
  const fc = (document.querySelector('[name="firstComment"]') || {}).value || '';
  return JSON.stringify({ comboboxes: cb, feats, firstCommentLen: fc.length });
})()`);
console.log('PERSISTED:', state);

// Launch Plan tab 真点击
const lp = await c.eval(`(() => {
  const t = [...document.querySelectorAll('[role=tab]')].find(e => (e.innerText || '').includes('Launch Plan'));
  if (!t) return 'no-tab';
  t.scrollIntoView({ block: 'center' });
  const r = t.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
if (lp.includes(',')) {
  const [x, y] = lp.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(1200);
}
const body = await c.eval(`document.body.innerText.replace(/\\s+/g, ' ')`);
console.log('LAUNCHPLAN_BODY:', body.slice(0, 1600));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_sslab_launchplan.jpg`, Buffer.from(s.data, 'base64'));
console.log('BODYLEN:', body.length);
console.log('FULLTAIL:', body.slice(1600, 3200));

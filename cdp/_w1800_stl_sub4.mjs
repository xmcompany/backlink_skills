import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const OUT = 'D:/Github/backlink_skills/runs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await sleep(500);
const shot = async (n) => { const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(`${OUT}/_w1800_stl_${n}.jpg`, Buffer.from(s.data, 'base64')); };
// 1. tags: 定位text输入框→insertText→Enter×3词
const tagPos = await c.eval(`(() => {
  const e = [...document.querySelectorAll('input[type=text]')].find(i => i.offsetParent !== null);
  if (!e) return 'no-el';
  e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect();
  return Math.round(r.x + 30) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('TAGPOS:', tagPos);
if (tagPos.includes(',')) {
  const [x, y] = tagPos.split(',').map(Number);
  for (const t of ['exterior design', 'home improvement', 'architecture']) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(150);
    await c.send('Input.insertText', { text: t });
    await sleep(200);
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(350);
  }
}
console.log('TAGS:', await c.eval(`document.body.innerText.match(/\(\d\/5 tags?\)/)?.[0] || 'none'`));
// 2. pricing free radio
const rp = await c.eval(`(() => {
  const e = [...document.querySelectorAll('input[type=radio]')].find(i => i.value === 'free');
  if (!e) return 'no-el';
  e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect();
  return Math.round(r.x + 8) + ',' + Math.round(r.y + 8);
})()`);
if (rp.includes(',')) {
  const [x, y] = rp.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
}
console.log('FREE_RADIO:', await c.eval(`[...document.querySelectorAll('input[type=radio]')].find(i=>i.value==='free')?.checked`));
// 3. Next
const nxt = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === 'Next');
  if (!b) return 'no-btn';
  if (b.disabled) return 'disabled';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('NEXT:', nxt);
if (nxt.includes(',')) {
  const [x, y] = nxt.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(2500);
}
console.log('STEP3_BODY:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,550)`));
await shot('step3c');
// 4. Launch Date: 找可选按钮/日期, 若有Next再点
const nxt2 = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === 'Next');
  if (!b) return 'no-btn';
  if (b.disabled) return 'disabled';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('NEXT2:', nxt2);
if (nxt2.includes(',')) {
  const [x, y] = nxt2.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(2500);
}
console.log('REVIEW_BODY:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,600)`));
await shot('review2');
// 5. Submit
const sub = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && /submit/i.test(x.innerText || ''));
  if (!b) return 'no-btn';
  if (b.disabled) return 'disabled';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('SUBMIT:', sub);
if (sub.includes(',')) {
  const [x, y] = sub.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
console.log('FINAL_URL:', await c.eval('location.href'));
console.log('FINAL_BODY:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,450)`));
await shot('final2');

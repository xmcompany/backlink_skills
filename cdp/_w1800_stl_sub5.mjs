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
const body0 = await c.eval(`document.body.innerText`);
console.log('TAGCOUNT:', body0.includes('/5 tags') ? body0.split('/5 tags')[0].slice(-8) : (body0.includes('/5 tag') ? body0.split('/5 tag')[0].slice(-8) : 'unknown'));

// radio free
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

const clickBtn = async (label) => {
  const pos = await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === '${label}');
    if (!b) return 'no-btn';
    if (b.disabled) return 'disabled';
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (!pos.includes(',')) return pos;
  const [x, y] = pos.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(2500);
  return 'clicked';
};
console.log('NEXT_A:', await clickBtn('Next'));
console.log('BODY_A:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,450)`));
console.log('NEXT_B:', await clickBtn('Next'));
console.log('BODY_B:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,550)`));
await shot('review3');
const sub = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim().toLowerCase().includes('submit'));
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
await shot('final3');

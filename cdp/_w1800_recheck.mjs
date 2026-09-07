// _w1800_recheck.mjs <urlpart> — 重勾checkbox→poll→token则提交
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const part = process.argv[2];
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes(part));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
await sleep(400);
const box = JSON.parse(await c.eval(`(() => {
  const f = document.querySelector('iframe[src*="google.com/recaptcha/api2/anchor"]');
  if (!f) return '{"x":0,"y":0}'; const b = f.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(b.x + 30), y: Math.round(b.y + b.height / 2) });
})()`));
if (!box.x) { console.log('NO_WIDGET'); process.exit(1); }
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
await sleep(150);
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1, buttons: 1 });
await sleep(70);
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1, buttons: 0 });
let token = 0;
for (let i = 0; i < 12; i++) {
  await sleep(1500);
  token = await c.eval(`(() => { const ta = document.querySelector('textarea[name="g-recaptcha-response"]'); return ta ? ta.value.length : -1; })()`).catch(() => -9);
  if (token > 20) break;
}
console.log(`token=${token}`);
if (token > 20) {
  await c.eval(`(() => { const f = document.querySelector('form'); f.requestSubmit ? f.requestSubmit() : f.submit(); })()`);
  await sleep(6000);
  const verdict = await c.eval(`document.body.innerText.slice(0, 800)`).catch(() => 'GONE');
  console.log('URL:', await c.eval('location.href').catch(() => 'GONE'));
  console.log('SUCCESS:', /awaiting approval/i.test(verdict) ? 'YES' : 'NO');
  console.log('TEXT:', JSON.stringify(String(verdict).slice(0, 200)));
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(`D:/Github/backlink_skills/runs/_w1800_${part}_submitted.jpg`, Buffer.from(s.data, 'base64'));
}
setTimeout(() => process.exit(0), 600);

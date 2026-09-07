// _w1800_alive_finish.mjs <urlpart> <tile1> <tile2> <tile3> <verifyXY> — 单进程连招
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const [part, t1, t2, t3, verify] = process.argv.slice(2);
const pts = [t1, t2, t3].map(s => s.split(',').map(Number));
const [vx, vy] = verify.split(',').map(Number);

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes(part));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
await sleep(300);

const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(60);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(300);
};

for (const [x, y] of pts) { await click(x, y); console.log('tile', x, y); }
await click(vx, vy);
console.log('verify clicked');

// 轮询 token, 15s
let token = 0;
for (let i = 0; i < 10; i++) {
  await sleep(1500);
  token = await c.eval(`(() => { const ta = document.querySelector('textarea[name="g-recaptcha-response"]'); return ta ? ta.value.length : -1; })()`);
  console.log(`poll ${i}: token=${token}`);
  if (token > 20) break;
}
if (token <= 20) {
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync('D:/Github/backlink_skills/runs/_w1800_alive_fail.jpg', Buffer.from(s.data, 'base64'));
  console.log('NO_TOKEN — 存图');
  process.exit(2);
}
// 立即提交
await c.eval(`(() => { const f = document.querySelector('form'); f.requestSubmit ? f.requestSubmit() : f.submit(); })()`);
await sleep(6000);
const verdict = await c.eval(`document.body.innerText.slice(0, 1000)`);
console.log('URL:', await c.eval('location.href'));
console.log('SUCCESS:', /awaiting approval/i.test(verdict) ? 'YES' : 'NO');
console.log('TEXT:', JSON.stringify(verdict.slice(0, 250)));
const s2 = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync('D:/Github/backlink_skills/runs/_w1800_alive_final.jpg', Buffer.from(s2.data, 'base64'));
setTimeout(() => process.exit(0), 800);

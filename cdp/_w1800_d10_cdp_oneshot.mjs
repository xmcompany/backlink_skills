// _w1800_d10_cdp_oneshot.mjs — 纯CDP连招: 点reCAPTCHA→轮询token→立即提交
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.url.includes('directory10'));
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
await sleep(500);

const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(200);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
};

// reCAPTCHA anchor iframe 内勾选框: iframe rect + (30, height/2)
const box = JSON.parse(await c.eval(`(() => {
  const f = document.querySelector('iframe[src*="google.com/recaptcha/api2/anchor"]');
  if (!f) return '{"x":0,"y":0}'; const b = f.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(b.x + 30), y: Math.round(b.y + b.height / 2) });
})()`));
console.log('captcha box at', box);
await click(box.x, box.y);

let token = 0;
for (let i = 0; i < 12; i++) {
  await sleep(1500);
  token = await c.eval(`(() => { const ta = document.querySelector('textarea[name="g-recaptcha-response"]'); return ta ? ta.value.length : -1; })()`);
  console.log(`poll ${i}: token=${token}`);
  if (token > 20) break;
  if (i === 4) {
    // 若出挑战图, 截图留证
    const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    writeFileSync('D:/Github/backlink_skills/runs/_w1800_d10_grid.jpg', Buffer.from(s.data, 'base64'));
  }
}

if (token > 20) {
  await c.eval(`(() => { const f = document.querySelector('form'); f.requestSubmit ? f.requestSubmit() : f.submit(); })()`);
  await sleep(6000);
  const verdict = await c.eval(`document.body.innerText.slice(0, 1200)`);
  console.log('URL:', await c.eval('location.href'));
  console.log('SUCCESS:', /awaiting approval/i.test(verdict) ? 'YES' : 'NO');
  console.log('TEXT:', JSON.stringify(verdict.slice(0, 300)));
  const s2 = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync('D:/Github/backlink_skills/runs/_w1800_d10_final.jpg', Buffer.from(s2.data, 'base64'));
} else {
  console.log('NO_TOKEN_FINAL — grid截图在 _w1800_d10_grid.jpg');
}
setTimeout(() => process.exit(0), 800);

// _w1800_stl_reg2.mjs — stellarlaunch 补name重提(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const EMAIL = 'stellarlaunch@92ng.com';
const PASS = 'Xx@Stl26!Xm';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const tabId = tab.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await sleep(1000);

const realClick = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
};
// 三字段全部native setter+input事件填一遍(React受控)
const st = await c.eval(`(() => {
  const setV = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const name = [...document.querySelectorAll('input')].find(i => i.type === 'text' && i.offsetParent !== null);
  const email = [...document.querySelectorAll('input')].find(i => i.type === 'email' && i.offsetParent !== null);
  const pass = [...document.querySelectorAll('input')].find(i => i.type === 'password' && i.offsetParent !== null);
  if (!name || !email || !pass) return 'missing:' + (!name ? 'name ' : '') + (!email ? 'email ' : '') + (!pass ? 'pass' : '');
  setV(name, 'Leo Xm'); setV(email, '${EMAIL}'); setV(pass, '${PASS}');
  return 'ok';
})()`);
console.log('FILL:', st);
const vals = await c.eval(`[...document.querySelectorAll('input')].filter(i=>i.offsetParent!==null).map(i=>i.type+':'+String(i.value||'').slice(0,12)).join(' | ')`);
console.log('VALS:', vals);
await sleep(1500);
const btn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && /create account/i.test(x.innerText || ''));
  if (!b) return 'no-btn'; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('BTN:', btn);
if (btn.includes(',')) { const [x, y] = btn.split(',').map(Number); await realClick(x, y); }
await sleep(5000);
console.log('AFTER_URL:', await c.eval('location.href'));
console.log('AFTER_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 600)`));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_stl_reg2.jpg`, Buffer.from(s.data, 'base64'));

// _w1800_stl_login.mjs — 登录+探submit表单(win1800补)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Target.activateTarget', { targetId: tab.id });
await sleep(800);

const realClick = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
};
// 登录表单当前已在页上(sign-in?redirect=/projects/submit)
const st = await c.eval(`(() => {
  const setV = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const email = [...document.querySelectorAll('input')].find(i => i.type === 'email' && i.offsetParent !== null);
  const pass = [...document.querySelectorAll('input')].find(i => i.type === 'password' && i.offsetParent !== null);
  if (!email || !pass) return 'missing';
  setV(email, 'stellarlaunch@387654.com'); setV(pass, 'Xx@Stl26!Xm');
  return 'ok';
})()`);
console.log('FILL:', st);
await sleep(1000);
const btn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === 'Login');
  if (!b) return 'no-btn'; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('BTN:', btn);
if (btn.includes(',')) { const [x, y] = btn.split(',').map(Number); await realClick(x, y); }
await sleep(4000);
console.log('AFTER_URL:', await c.eval('location.href'));
await c.goto('https://www.stellarlaunch.org/projects/submit', 30000);
await sleep(4500);
console.log('SUBMIT_URL:', await c.eval('location.href'));
console.log('FIELDS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('input,textarea,select,button,[role=combobox]')) {
    if (e.offsetParent === null) continue;
    if (e.tagName === 'INPUT') out.push('I:' + e.type + ':' + (e.name || e.placeholder || '').slice(0, 32));
    else if (e.tagName === 'TEXTAREA') out.push('T:' + (e.name || e.placeholder || '').slice(0, 32));
    else if (e.tagName === 'SELECT') out.push('S:' + e.name);
    else { const t = (e.innerText || '').trim().slice(0, 32); if (t) out.push(e.tagName === 'BUTTON' ? 'B:' + t : 'C:' + t); }
  }
  return JSON.stringify([...new Set(out)].slice(0, 32));
})()`));
console.log('BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 600)`));

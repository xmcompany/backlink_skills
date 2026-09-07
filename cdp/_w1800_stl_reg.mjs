// _w1800_stl_reg.mjs — stellarlaunch.org 注册尝试(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const EMAIL = 'stellarlaunch@92ng.com';
const PASS = 'Xx@Stl26!Xm';

const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await c.goto('https://www.stellarlaunch.org/sign-up', 30000);
await sleep(4500);
console.log('URL:', await c.eval('location.href'));

const shot = async (name) => {
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(`${OUT}/_w1800_stl_${name}.jpg`, Buffer.from(s.data, 'base64'));
};
const realClick = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
};

// 字段结构
console.log('FIELDS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('input,button[type=submit],button')) {
    if (e.offsetParent === null) continue;
    out.push((e.tagName === 'INPUT' ? ('I:' + e.type + ':' + (e.name || e.placeholder || '') ) : ('B:' + (e.innerText || '').trim().slice(0, 30))));
  }
  return JSON.stringify(out);
})()`));

// 填 email + password (insertText真打字)
const fill = async (type, text) => {
  const st = await c.eval(`(() => {
    const e = [...document.querySelectorAll('input')].find(i => i.type === '${type}' && i.offsetParent !== null);
    if (!e) return 'no-el';
    e.scrollIntoView({ block: 'center' }); e.focus(); e.click();
    const r = e.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (!st.includes(',')) return st;
  const [x, y] = st.split(',').map(Number);
  await realClick(x, y);
  await c.send('Input.insertText', { text });
  await sleep(200);
  return await c.eval(`([...document.querySelectorAll('input')].find(i => i.type === '${type}' && i.offsetParent !== null) || {}).value || ''`);
};
console.log('EMAIL_FILL:', await fill('email', EMAIL));
console.log('PASS_FILL:', (await fill('password', PASS)).length > 5 ? 'OK(len)' : 'FAIL');
await shot('filled');

// turnstile 状态
await sleep(2500);
console.log('TURNSTILE:', await c.eval(`(() => {
  const f = document.querySelector('iframe[src*="turnstile"],iframe[src*="challenges"]');
  const w = document.querySelector('[class*=turnstile],[data-turnstile],.cf-turnstile');
  return JSON.stringify({ iframe: f ? f.src.slice(0, 60) : null, widget: !!w, hiddenInput: (document.querySelector('input[name="cf-turnstile-response"],input[name="turnstile"]') || {}).value ? 'has-token' : 'no-token-yet' });
})()`));

// 提交
const btn = await c.eval(`(() => {
  const bs = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && /sign up|create/i.test(b.innerText || ''));
  if (!bs.length) return 'no-btn';
  const b = bs[0]; b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('SUBMIT_BTN:', btn);
if (btn.includes(',')) { const [x, y] = btn.split(',').map(Number); await realClick(x, y); }
await sleep(4000);
console.log('AFTER_URL:', await c.eval('location.href'));
console.log('AFTER_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500)`));
await shot('after_submit');

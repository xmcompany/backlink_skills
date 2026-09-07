// _w1800_stl_verify_submit.mjs — 验证邮箱+探submit表单(win1800补)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const VERIFY = 'https://www.stellarlaunch.org/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InN0ZWxsYXJsYXVuY2hAMzg3NjU0LmNvbSIsImlhdCI6MTc4ODY5MzgyMSwiZXhwIjoxNzg4NzgwMjIxfQ.6d2LBc9PuPIIFVnBtEEHG-OhucVvQQtIjQbbThga0QY&callbackURL=%2Fverify-email%2Fsuccess';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.goto(VERIFY, 30000);
await sleep(3500);
console.log('VERIFY_URL:', await c.eval('location.href'));
console.log('VERIFY_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 250)`));

// 登录态检查 + submit表单
await c.goto('https://www.stellarlaunch.org/projects/submit', 30000);
await sleep(4500);
console.log('SUBMIT_URL:', await c.eval('location.href'));
console.log('SUBMIT_TITLE:', await c.eval('document.title'));
console.log('FIELDS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('input,textarea,select,button,[role=combobox]')) {
    if (e.offsetParent === null) continue;
    if (e.tagName === 'INPUT') out.push('I:' + e.type + ':' + (e.name || e.placeholder || '').slice(0, 30));
    else if (e.tagName === 'TEXTAREA') out.push('T:' + (e.name || e.placeholder || '').slice(0, 30));
    else if (e.tagName === 'SELECT') out.push('S:' + (e.name || '') );
    else { const t = (e.innerText || '').trim().slice(0, 30); if (t) out.push(e.tagName === 'BUTTON' ? 'B:' + t : 'C:' + t); }
  }
  return JSON.stringify([...new Set(out)].slice(0, 30));
})()`));
console.log('BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500)`));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_stl_submitform.jpg`, Buffer.from(s.data, 'base64'));

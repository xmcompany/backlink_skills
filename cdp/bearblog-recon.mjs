// bearblog-relogin.mjs — cookie 过期，账密重登 + dashboard 侦察
import { connect, newTab, realClick, clickEl, typeInto, waitFor, log } from './lib.mjs';
import { writeFileSync } from 'fs';

const SHOT = 'D:/Github/backlink_skills/runs/bearblog';
const { cdp, tab } = await newTab('https://bearblog.dev/accounts/login/', 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`, { signal: AbortSignal.timeout(3000) }).catch(()=>{});
await new Promise(r => setTimeout(r, 4000));

const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${SHOT}-${name}.jpg`, Buffer.from(data, 'base64'));
  log('shot', name);
};

// 表单侦察
const recon = await cdp.eval(`(() => {
  const inputs = [...document.querySelectorAll('input')].map(i => ({t:i.type,n:i.name,id:i.id,vis:!!i.offsetParent}));
  return JSON.stringify({url: location.href, inputs});
})()`);
console.log('FORM:', recon);

// 填账密（Django 表单：username+password）
const f1 = await typeInto(cdp, 'input[name=login]', 'bearblog@92ng.com');
const f2 = await typeInto(cdp, 'input[name=password]', 'Tq7mz!Vb42xwQp');
log('fill', f1, f2);
await shot('02-filled');

// 提交
await clickEl(cdp, `[...document.querySelectorAll('button')].find(b => b.type==='submit' || b.textContent.includes('Log')) || document.querySelector('input[type=submit]')`);
const ok = await waitFor(cdp, `location.href.includes('dashboard')`, 15000);
await new Promise(r => setTimeout(r, 2000));
await shot('03-after-login');
console.log('LOGIN:', ok ? 'OK' : 'FAIL', await cdp.eval(`location.href`));

const recon2 = await cdp.eval(`(() => {
  const links = [...document.querySelectorAll('a')].map(a => ({t: a.textContent.trim().slice(0,30), h: a.getAttribute('href')})).filter(x => x.h).slice(0, 25);
  return JSON.stringify({url: location.href, links});
})()`);
console.log('DASH:', recon2);

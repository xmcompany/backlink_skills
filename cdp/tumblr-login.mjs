// tumblr-login.mjs — cookie 过期，邮箱+密码重登（tumblr 两步式：邮箱→密码）
import { connect, newTab, realClick, clickEl, typeInto, waitFor, log } from './lib.mjs';
import { writeFileSync } from 'fs';

const SHOT = 'D:/Github/backlink_skills/runs/tumblr';
const { cdp, tab } = await newTab('https://www.tumblr.com/login', 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`, { signal: AbortSignal.timeout(3000) }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${SHOT}-${name}.jpg`, Buffer.from(data, 'base64'));
  log('shot', name);
};

// 第一步：邮箱
const f1 = await typeInto(cdp, 'input[type=email]', 'tumblr@92ng.com');
log('email fill:', f1);
await shot('02-email');
await clickEl(cdp, `[...document.querySelectorAll('button')].find(b => /next|continue|登录|log ?in/i.test(b.textContent))`);
await new Promise(r => setTimeout(r, 3500));

// 第二步：密码
const f2 = await typeInto(cdp, 'input[type=password]', 'Tum@x98fe0Q7');
log('pass fill:', f2);
await shot('03-pass');
await clickEl(cdp, `[...document.querySelectorAll('button')].find(b => /log ?in|登录|sign in/i.test(b.textContent))`);
await new Promise(r => setTimeout(r, 5000));
await shot('04-after');
console.log(await cdp.eval(`JSON.stringify({url: location.href.slice(0,80), ok: !location.href.includes('login')})`));

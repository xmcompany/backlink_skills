// mastodon-login.mjs — halfway 收口 mastodon.social (DR95)：密码登录 → 截图定性
import { newTab, realClick, clickEl, typeInto, waitFor, log } from './lib.mjs';
import { writeFileSync } from 'fs';

const SHOT = 'D:/Github/backlink_skills/runs/mastodon';
const { cdp, tab } = await newTab('https://mastodon.social/auth/sign_in', 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`, { signal: AbortSignal.timeout(3000) }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${SHOT}-${name}.jpg`, Buffer.from(data, 'base64'));
  log('shot', name);
};
await shot('01-open');

const recon = await cdp.eval(`(() => {
  const inputs = [...document.querySelectorAll('input')].map(i => ({t: i.type, n: i.name, id: i.id, ph: i.placeholder, vis: !!i.offsetParent}));
  const btns = [...document.querySelectorAll('button')].slice(0,8).map(b => ({txt: b.textContent.trim().slice(0,30), vis: !!b.offsetParent}));
  return JSON.stringify({url: location.href, title: document.title.slice(0,50), inputs, btns});
})()`);
console.log(recon);

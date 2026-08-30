// kofi-recon.mjs — #90 ko-fi (DR92) 发文路径侦察（登录态在 9224 profile）
import { connect, newTab, realClick, clickEl, typeInto, waitFor, log } from './lib.mjs';
import { writeFileSync } from 'fs';

const SHOT = 'D:/Github/backlink_skills/runs/kofi';
const { cdp, tab } = await newTab('https://ko-fi.com/leoxm', 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`, { signal: AbortSignal.timeout(3000) }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${SHOT}-${name}.jpg`, Buffer.from(data, 'base64'));
  log('shot', name);
};
await shot('01-profile');

const recon = await cdp.eval(`(() => {
  const txt = document.body.innerText.slice(0, 400);
  const links = [...document.querySelectorAll('a')].map(a => ({t: a.textContent.trim().slice(0,25), h: a.getAttribute('href')})).filter(x => x.h && /post|blog|article|write|new|dashboard/i.test(x.h + x.t)).slice(0, 15);
  return JSON.stringify({url: location.href, title: document.title.slice(0,60), hasFeed: /Follow|following|posts/i.test(txt), links});
})()`);
console.log(recon);

// _w1800_sslab_recon.mjs — startupslab.site 登录态+提交入口侦察(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const URL0 = process.argv[2] || 'https://startupslab.site/my-products';

// ★铁律: 一律 PUT /json/new 开新tab, 同tab二次WS连接会挂死(win1400复训)
const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await c.goto(URL0, 30000);
await sleep(4000);
console.log('URL:', await c.eval('location.href'));
console.log('TITLE:', await c.eval('document.title'));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_sslab_recon.jpg`, Buffer.from(s.data, 'base64'));

// 可见文本按钮/链接
const els = await c.eval(`(() => {
  const out = [];
  for (const a of document.querySelectorAll('a,button')) {
    if (a.offsetParent === null) continue;
    const t = (a.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
    const h = a.getAttribute('href') || '';
    if (t) out.push((a.tagName === 'A' ? 'A:' : 'B:') + t + (h ? ' @' + h : ''));
  }
  return [...new Set(out)].slice(0, 40);
})()`);
console.log('ELSVISIBLE:', JSON.stringify(els, null, 1));
console.log('BODYTEXT:', await c.eval(`document.body.innerText.replace(/\\s+/g,' ').slice(0,600)`));

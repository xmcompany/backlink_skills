// _w1800_ps_recon.mjs — proofstories.io /submit/ 渲染侦察(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await c.goto('https://proofstories.io/submit/', 30000);
await sleep(5000);
console.log('URL:', await c.eval('location.href'));
console.log('TITLE:', await c.eval('document.title'));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_ps_recon.jpg`, Buffer.from(s.data, 'base64'));
console.log('INPUTS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('input,textarea,select')) {
    if (e.offsetParent === null) continue;
    out.push({ tag: e.tagName, type: e.type, name: e.name || '', ph: e.placeholder || '', req: e.required || false });
  }
  return JSON.stringify(out);
})()`));
console.log('BTNS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('button,[role=button],a')) {
    if (e.offsetParent === null) continue;
    const t = (e.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    if (t) out.push(e.tagName + ':' + t);
  }
  return JSON.stringify([...new Set(out)].slice(0, 25));
})()`));
console.log('BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 800)`));

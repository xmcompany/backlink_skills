import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await sleep(300);
console.log('URL:', await c.eval('location.href'));
console.log('BODY:', await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,500)`));

import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const [part, name] = process.argv.slice(2);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes(part));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const c = await CDP.attachById(tab.id, 9224);
await sleep(1200);
const st = await c.eval(`(() => { const ta = document.querySelector('textarea[name="g-recaptcha-response"]'); return ta ? ta.value.length : -1; })()`);
console.log('TOKEN:', st);
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`D:/Github/backlink_skills/runs/_w1800_${name}.jpg`, Buffer.from(s.data, 'base64'));
setTimeout(() => process.exit(0), 600);

// _w1800_shot.mjs <urlpart> <name> — attach+activate+screenshot
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const [part, name] = process.argv.slice(2);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes(part));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
await sleep(600);
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`D:/Github/backlink_skills/runs/_w1800_${name}.jpg`, Buffer.from(s.data, 'base64'));
console.log('SHOT_OK', tab.url.slice(0, 80));
setTimeout(() => process.exit(0), 800);

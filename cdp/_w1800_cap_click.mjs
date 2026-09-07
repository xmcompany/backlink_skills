// _w1800_cap_click.mjs <x> <y> [more:x2,y2] — CDP点击挑战图块
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const pts = process.argv.slice(2).map(s => s.split(',').map(Number));
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.url.includes('directory10'));
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
for (const [x, y] of pts) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(70);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
  console.log('clicked', x, y);
  await sleep(400);
}
await sleep(400);
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync('D:/Github/backlink_skills/runs/_w1800_cap_state.jpg', Buffer.from(s.data, 'base64'));
console.log('shot saved');
setTimeout(() => process.exit(0), 600);

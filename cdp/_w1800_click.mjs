// _w1800_click.mjs <urlpart> <x> <y> — clear emulation, diagnose, real click
import { CDP, sleep } from './CDP.mjs';
const [part, xs, ys] = process.argv.slice(2);
const x = Number(xs), y = Number(ys);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes(part));
const c = await CDP.attachById(tab.id, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Page.enable');
await c.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
await sleep(400);
const at = await c.eval(`(() => { const e = document.elementFromPoint(${x}, ${y});
  return e ? (e.tagName + '|' + (e.src || '').slice(0, 60) + '|' + (e.name || '')) : 'null'; })()`);
console.log('elementFromPoint:', at);
const meta = await c.eval(`JSON.stringify({dpr: window.devicePixelRatio, iw: innerWidth, ih: innerHeight, sy: scrollY})`);
console.log('viewport:', meta);
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await sleep(400);
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
await sleep(120);
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
await sleep(4500);
const st = await c.eval(`(() => {
  const ta = document.querySelector('textarea[name="g-recaptcha-response"]');
  return JSON.stringify({ token: ta ? ta.value.length : -1, agree: (document.querySelector('input[name=agree]')||{}).checked });
})()`);
console.log('after-click:', st);
setTimeout(() => process.exit(0), 800);

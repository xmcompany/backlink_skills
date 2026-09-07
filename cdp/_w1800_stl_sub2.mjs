// _w1800_stl_sub2.mjs — stellarlaunch step1修正版: contenteditable描述(win1800补)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const LOGO = 'D:/Github/backlink_skills/assets/gfh-logo-500.png';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.goto('https://www.stellarlaunch.org/projects/submit', 30000);
await sleep(4000);
const shot = async (n) => { const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(`${OUT}/_w1800_stl_${n}.jpg`, Buffer.from(s.data, 'base64')); };

const st = await c.eval(`(() => {
  const setV = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const name = document.querySelector('input[name="name"]');
  const url = document.querySelector('input[name="websiteUrl"]');
  const tag = document.querySelector('input[name="tagline"]');
  if (!name || !url || !tag) return 'missing-inputs';
  setV(name, 'Generator For House');
  setV(url, 'https://generatorforhouse.org');
  setV(tag, 'Free AI exterior design generator with real project cost data');
  return 'ok';
})()`);
console.log('FILL:', st);

// contenteditable 描述: 真点击聚焦 + insertText
const ce = await c.eval(`(() => {
  const e = document.querySelector('[contenteditable=true]');
  if (!e) return 'no-ce';
  e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + Math.min(r.height / 2, 40));
})()`);
console.log('CE:', ce);
if (ce.includes(',')) {
  const [x, y] = ce.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
  await c.send('Input.insertText', { text: 'Generator For House helps homeowners and builders design house exteriors for free. Get instant cost estimates based on real project data by region and material, explore style suggestions for facades, roofs, and outdoor spaces, and plan renovation budgets before talking to contractors.' });
  await sleep(400);
}
console.log('CE_TEXT_LEN:', await c.eval(`(document.querySelector('[contenteditable=true]')||{textContent:''}).textContent.length`));

// logo 再传一次保险
const doc = await c.send('DOM.getDocument');
const node = await c.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
if (node.nodeId) { await c.send('DOM.setFileInputFiles', { files: [LOGO], nodeId: node.nodeId }); await sleep(2000); console.log('LOGO: set'); }

const vals = await c.eval(`[...document.querySelectorAll('input')].filter(i=>i.offsetParent!==null).map(i=>(i.name||i.type)+':'+String(i.value||'').length).join('|')`);
console.log('VALS:', vals);
await shot('step1b');
const nxt = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === 'Next');
  if (!b) return 'no-btn';
  if (b.disabled) return 'disabled';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('NEXT:', nxt);
if (nxt.includes(',')) {
  const [x, y] = nxt.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(2500);
}
console.log('STEP2_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 650)`));
console.log('STEP2_FIELDS:', await c.eval(`(() => {
  const out = [];
  for (const e of document.querySelectorAll('input,textarea,select,[role=combobox],[role=radio],[role=checkbox]')) {
    if (e.offsetParent === null) continue;
    out.push(e.tagName.slice(0,1)+':'+(e.type||e.getAttribute('role')||'')+':'+(e.name||e.placeholder||(e.innerText||'').slice(0,25)));
  }
  return JSON.stringify(out.slice(0, 22));
})()`));
await shot('step2b');

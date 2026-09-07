// _w1800_sslab_edit.mjs — startupslab 产品编辑页结构dump(win1800)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const EDIT = process.argv[2] || 'https://startupslab.site/my-products/edit/generator-for-house';

const nw = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
const tabId = nw.id;
const c = await CDP.attachById(tabId, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Target.activateTarget', { targetId: tabId });
await c.goto(EDIT, 30000);
await sleep(4500);
console.log('URL:', await c.eval('location.href'));
console.log('TITLE:', await c.eval('document.title'));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
writeFileSync(`${OUT}/_w1800_sslab_edit.jpg`, Buffer.from(s.data, 'base64'));

const dump = await c.eval(`(() => {
  const out = { inputs: [], buttons: [], roles: [], tabs: [] };
  for (const e of document.querySelectorAll('input,textarea,select')) {
    if (e.offsetParent === null && e.type !== 'hidden') continue;
    out.inputs.push({ tag: e.tagName, type: e.type, name: e.name || '', ph: e.placeholder || '', val: String(e.value || '').slice(0, 50) });
  }
  for (const e of document.querySelectorAll('button,[role=combobox],[role=option],[role=tab]')) {
    if (e.offsetParent === null) continue;
    const r = e.getBoundingClientRect();
    const t = (e.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
    if (!t && e.getAttribute('role') !== 'combobox') continue;
    const item = { role: e.getAttribute('role') || 'button', text: t, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    if (e.getAttribute('role') === 'tab') out.tabs.push(item); else out.roles.push(item);
  }
  return out;
})()`);
console.log('INPUTS:', JSON.stringify(dump.inputs, null, 1));
console.log('BUTTONS/ROLES:', JSON.stringify(dump.roles, null, 1));
console.log('TABS:', JSON.stringify(dump.tabs, null, 1));
console.log('BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g,' ').slice(0,900)`));

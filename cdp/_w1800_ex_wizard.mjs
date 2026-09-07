// _w1800_ex_wizard.mjs — exampledir.com phpLD4 向导真实浏览器流程探路
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && (t.url.includes('exampledir') || t.url === 'about:blank'));
const tabId = tab ? tab.id : (await (await fetch('http://127.0.0.1:9224/json/new?url', { method: 'PUT' })).json()).id;
const c = await CDP.attachById(tabId, 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tabId}`);
await c.send('Page.enable');
await c.goto('https://exampledir.com/submit', 30000);
await sleep(2500);

// 看页面上所有可点击的按钮/链接文本
const ui = await c.eval(`(() => {
  const btns = [...document.querySelectorAll('button, input[type=submit], a.button, .button, a[href="#"]')]
    .filter(e => e.offsetParent !== null)
    .map(e => (e.tagName + '|' + (e.value || e.textContent || '').trim().slice(0, 30) + '|' + e.className)).slice(0, 20);
  const cats = [...document.querySelectorAll('select')].map(s => s.name + ':' + s.options.length);
  return JSON.stringify({ btns, cats, forms: document.forms.length });
})()`);
console.log('UI:', ui);

// 选分类: 多选select或树形? dump表单结构
const form = await c.eval(`(() => {
  const f = document.querySelector('form#submitForm') || document.querySelector('form');
  if (!f) return 'no-form';
  const fields = [...f.querySelectorAll('input,select,textarea')].filter(e => e.offsetParent !== null || e.type === 'hidden')
    .map(e => e.type + ':' + e.name + (e.value ? '=' + String(e.value).slice(0,20) : ''));
  return JSON.stringify({ action: f.action, fields: fields.slice(0, 30) });
})()`);
console.log('FORM:', form);

// 模拟: 选中 Computers 多选 + 触发change, 然后找Continue按钮点击
const pick = await c.eval(`(() => {
  const sel = document.querySelector('select[name="ADD_CATEGORY_ID[]"]');
  if (!sel) return 'no-multi';
  [...sel.options].forEach(o => { if (o.value === '10') { o.selected = true; } });
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return 'picked-10';
})()`);
console.log('PICK:', pick);
await sleep(1500);

// 找提交/继续按钮(可能是a/button)
const btn = await c.eval(`(() => {
  const cands = [...document.querySelectorAll('button, input[type=submit], a')].filter(e => e.offsetParent !== null);
  const b = cands.find(e => /continue|next|submit|proceed/i.test(e.textContent || e.value || ''));
  if (!b) return 'none: ' + cands.map(e => (e.textContent || e.value || '').trim().slice(0, 15)).filter(Boolean).join(',').slice(0, 150);
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('BTN:', btn);
if (btn.includes(',')) {
  const [x, y] = btn.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
  await sleep(4000);
  console.log('URL after:', await c.eval('location.href'));
  const hasTitle = await c.eval(`document.body.innerHTML.includes('name="TITLE"')`);
  console.log('STEP2 TITLE field:', hasTitle);
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync('D:/Github/backlink_skills/runs/_w1800_ex_step2.jpg', Buffer.from(s.data, 'base64'));
}
console.log('TAB_ID=' + tabId);
setTimeout(() => process.exit(0), 800);

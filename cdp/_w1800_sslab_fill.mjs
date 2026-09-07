// _w1800_sslab_fill.mjs — startupslab generator-for-house 收口: category+features+Save(win1800)
// proven trap: 分类必须真实点击下拉项(native setter不进React state); 文本框用insertText真打字
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
await sleep(4000);

const shot = async (name) => {
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  writeFileSync(`${OUT}/_w1800_sslab_${name}.jpg`, Buffer.from(s.data, 'base64'));
};
const realClick = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(120);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(350);
};
const clickByText = async (selector, text, exact = false) => {
  const pos = await c.eval(`(() => {
    const els = [...document.querySelectorAll('${selector}')].filter(e => {
      if (e.offsetParent === null) return false;
      const t = (e.innerText || e.textContent || '').trim().replace(/\\s+/g, ' ');
      return ${exact ? `t === '${text}'` : `t.includes('${text}')`};
    });
    if (!els.length) return 'no-el';
    const e = els[0]; e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (!pos.includes(',')) return pos;
  const [x, y] = pos.split(',').map(Number);
  await realClick(x, y);
  return 'clicked@' + pos;
};

// ── 1. Category: 点 trigger 开下拉 → 点 "AI & Machine Learning"
console.log('CAT_TRIGGER:', await clickByText('[role=combobox]', 'Select a category'));
await sleep(700);
const optDump = await c.eval(`(() => [...document.querySelectorAll('[role=option],li,[cmdk-item]')].filter(e => e.offsetParent !== null).map(e => (e.innerText||'').trim().replace(/\\s+/g,' ').slice(0,40)).filter(Boolean).slice(0,30))()`);
console.log('OPTIONS_NOW:', JSON.stringify(optDump));
console.log('CAT_OPTION:', await clickByText('[role=option],li,[cmdk-item]', 'AI & Machine Learning'));
await sleep(500);
console.log('CAT_STATE:', await c.eval(`(() => { const s=[...document.querySelectorAll('select')].find(x=>!x.value); const cb=[...document.querySelectorAll('[role=combobox]')].map(e=>e.innerText.trim()).join('|'); return JSON.stringify({emptySelVal: s ? s.value : 'none', selShown: s ? (s.selectedOptions[0]||{}).text : '-', combobox: cb}); })()`));

// ── 2. Platforms: 选 Web(可选,失败不阻塞)
try {
  console.log('PLAT_TRIGGER:', await clickByText('[role=combobox]', 'Select platforms'));
  await sleep(600);
  console.log('PLAT_OPT:', await clickByText('[role=option],li,[cmdk-item]', 'Web', false));
  await sleep(400);
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
} catch (e) { console.log('PLAT skip:', e.message); }

// ── 3. Features 5条: insertText 真打字
const FEATS = [
  'Free exterior design calculator with instant cost estimates',
  'Real project cost data by region and material type',
  'Style suggestions for facades, roofs, and outdoor spaces',
  'Works on mobile, no signup required',
  'Independent budgeting tips from real build data',
];
for (let i = 0; i < FEATS.length; i++) {
  let sel = await c.eval(`(() => { const e=document.querySelector('[name="features.${i}.value"]'); if(!e) return 'no-el'; if(e.offsetParent===null) return 'hidden';
    e.scrollIntoView({block:'center'}); e.focus(); const r=e.getBoundingClientRect(); return Math.round(r.x+r.width/2)+','+Math.round(r.y+r.height/2); })()`);
  if (sel === 'no-el') {
    console.log('FEAT add: 点击+ Add Feature');
    await clickByText('button', 'Add Feature');
    await sleep(500);
    sel = await c.eval(`(() => { const e=document.querySelector('[name="features.${i}.value"]'); if(!e) return 'no-el'; e.scrollIntoView({block:'center'}); e.focus(); const r=e.getBoundingClientRect(); return Math.round(r.x+r.width/2)+','+Math.round(r.y+r.height/2); })()`);
  }
  if (sel === 'no-el' || sel === 'hidden') { console.log(`FEAT${i}: ${sel}`); continue; }
  await c.send('Input.insertText', { text: FEATS[i] });
  await sleep(250);
  const val = await c.eval(`(document.querySelector('[name="features.${i}.value"]')||{}).value||''`);
  console.log(`FEAT${i}: len=${val.length} ${val.length > 10 ? 'OK' : 'MISMATCH:' + val.slice(0, 30)}`);
}

// ── 4. firstComment(可选)
const fc = await c.eval(`(() => { const e=document.querySelector('[name="firstComment"]'); if(!e) return 'no-el'; e.scrollIntoView({block:'center'}); e.focus(); return 'ok'; })()`);
if (fc === 'ok') {
  await c.send('Input.insertText', { text: 'We built this because exterior renovation quotes are all over the place. Generator For House gives you a free, data-backed estimate before you talk to any contractor. Feedback welcome!' });
  await sleep(250);
  console.log('FIRSTCOMMENT: filled');
} else console.log('FIRSTCOMMENT:', fc);

await shot('filled');

// ── 5. Save Changes 真点击
console.log('SAVE:', await clickByText('button', 'Save Changes', true));
await sleep(3000);
console.log('AFTER_SAVE_URL:', await c.eval('location.href'));
console.log('AFTER_SAVE_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g,' ').slice(0,500)`));
await shot('saved');

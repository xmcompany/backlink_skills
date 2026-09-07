// _w1800_stl_sub3.mjs — stellarlaunch step2分类→step3→review→submit(win1800补)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

const OUT = 'D:/Github/backlink_skills/runs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await c.send('Target.activateTarget', { targetId: tab.id });
await sleep(800);
const shot = async (n) => { const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(`${OUT}/_w1800_stl_${n}.jpg`, Buffer.from(s.data, 'base64')); };
const clickText = async (text, tags = 'button,label,[role=checkbox],div,span', exact = false) => {
  const pos = await c.eval(`(() => {
    const els = [...document.querySelectorAll('${tags}')].filter(e => {
      if (e.offsetParent === null) return false;
      const t = (e.innerText || '').trim().replace(/\\s+/g, ' ');
      return ${exact ? `t === '${text}'` : `t === '${text}' || (t.length < 40 && t.includes('${text}'))`};
    });
    if (!els.length) return 'no-el';
    const e = els[els.length - 1];
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (!pos.includes(',')) return pos;
  const [x, y] = pos.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(600);
  return 'clicked';
};
const clickNext = async () => {
  const pos = await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && x.innerText.trim() === 'Next');
    if (!b) return 'no-btn';
    if (b.disabled) return 'disabled';
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
  })()`);
  if (!pos.includes(',')) return pos;
  const [x, y] = pos.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(2200);
  return 'nexted';
};

// ── step2: 勾 Artificial Intelligence
console.log('CAT_AI:', await clickText('Artificial Intelligence'));
console.log('CAT_STATE:', await c.eval(`(() => { const m = document.body.innerText.match(/\\((\\d)\\/3 selected\\)/); return m ? m[0] : 'no-counter'; })()`));
console.log('NEXT2:', await clickNext());

// ── step3 body dump
console.log('STEP3_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 600)`));
await shot('step3');
// 找 Launch Date 可点项(默认可能已选)
const dateState = await c.eval(`(() => {
  const sel = [...document.querySelectorAll('input[type=radio]:checked,input[type=checkbox]:checked')].length;
  const btns = [...document.querySelectorAll('button,[role=radio],label,div')].filter(e => e.offsetParent !== null && /mon|tue|wed|jun|jul|aug|sep|20\\d\\d/i.test(e.innerText || '') && (e.innerText || '').trim().length < 60).map(e => (e.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 40));
  return JSON.stringify({ checked: sel, dateBtns: [...new Set(btns)].slice(0, 8) });
})()`);
console.log('DATE_STATE:', dateState);
console.log('NEXT3:', await clickNext());

// ── review dump + submit
console.log('REVIEW_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 700)`));
await shot('review');
const sub = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.offsetParent !== null && /submit/i.test(x.innerText || ''));
  if (!b) return 'no-btn';
  if (b.disabled) return 'disabled';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
})()`);
console.log('SUBMIT_BTN:', sub);
if (sub.includes(',')) {
  const [x, y] = sub.split(',').map(Number);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
console.log('FINAL_URL:', await c.eval('location.href'));
console.log('FINAL_BODY:', await c.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500)`));
await shot('final');

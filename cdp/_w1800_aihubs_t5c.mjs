// win1800 aihubs t5 收口: chip驱动补缺+提交
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('aihubs'));
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) { console.log('JS-ERR:', (r.exceptionDetails.exception?.description || '').slice(0, 150)); return undefined; }
  return r.result ? r.result.value : undefined;
};

async function pickDropdown(re, word, want, takeN) {
  const trig = await ev(`(function(){
    var cand=[...document.querySelectorAll('button,[role=combobox]')].find(function(b){
      return ${re}.test(b.innerText||b.textContent||'');
    });
    if(!cand) return 'NF';
    cand.scrollIntoView({block:'center'});
    var r=cand.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, cur:(cand.innerText||'').trim().slice(0,40)});
  })()`);
  if (!trig || trig === 'NF') { console.log('trigger NF', re); return; }
  const t = JSON.parse(trig);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await sleep(300);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await sleep(2200);
  const si = await ev(`(function(){
    var s=[...document.querySelectorAll('[role=dialog] input,[data-radix-popper-content-wrapper] input')].find(function(i){
      var r=i.getBoundingClientRect(); return r.width>50;
    });
    if(!s) return 'NO';
    s.focus(); return 'OK';
  })()`);
  if (si !== 'OK') { console.log('search NF', re, t.cur); return; }
  await cdp.send('Input.insertText', { text: word });
  await sleep(2000);
  const opts = await ev(`(function(){
    var wrap=[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].pop();
    if(!wrap) return '[]';
    var items=[...wrap.querySelectorAll('[role=option],[cmdk-item],[role=command-item]')];
    var trigY=${t.y};
    var hits=items.filter(function(o){
      var r=o.getBoundingClientRect();
      return r.y>trigY && r.width>50 && ${want}.test(o.textContent);
    });
    return JSON.stringify(hits.slice(0,${takeN}).map(function(o){
      var r=o.getBoundingClientRect();
      return {t:o.textContent.trim().slice(0,30), x:r.x+20, y:r.y+r.height/2};
    }));
  })()`);
  let arr = [];
  try { arr = JSON.parse(opts); } catch(e) { console.log('opts bad'); }
  for (const o of arr) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: o.x, y: o.y });
    await sleep(180);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    console.log('picked:', o.t);
    await sleep(800);
  }
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);
}

// chip 现状
const before = await ev(`(function(){
  var t=document.body.innerText;
  var i=t.indexOf('Categories'), j=t.indexOf('Description');
  return (i>=0&&j>i)? t.slice(i, j).replace(/[\\n]+/g,' | ').slice(0,120) : 'segNF';
})()`);
console.log('before:', before);

await pickDropdown('/select categor/i', 'ai', '/^(AI|Artificial|Director)/i', 2);
await pickDropdown('/select tag/i', 'directory', '/director|ai tool|artificial/i', 2);

// 上传(若已挂会保留)
await cdp.send('DOM.enable');
const doc = await cdp.send('DOM.getDocument');
const q = await cdp.send('DOM.querySelectorAll', { selector: 'input[type=file]', nodeId: doc.root.nodeId });
const filesNow = await ev(`JSON.stringify([...document.querySelectorAll('input[type=file]')].map(function(f){ return [...f.files].length; }))`);
console.log('file counts:', filesNow);
const fc = JSON.parse(filesNow || '[0,0]');
if (String(fc[0]) === '0') {
  await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/logo-500.png'], nodeId: q.nodeIds[0] });
  await sleep(1500);
}
if (String(fc[1]) === '0') {
  await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/avg-banner-16x9.png'], nodeId: q.nodeIds[1] });
  await sleep(2000);
}

// 提交
const sb = await ev(`(function(){
  var btns=[...document.querySelectorAll('button')];
  var sub=btns.find(function(b){ return /^submit$/i.test((b.innerText||'').trim()); });
  if(!sub) return 'NF';
  sub.scrollIntoView({block:'center'});
  var r=sub.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, dis:sub.disabled});
})()`);
if (sb && sb !== 'NF') {
  const s = JSON.parse(sb);
  if (!s.dis) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.x, y: s.y });
    await sleep(250);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    console.log('submitted');
    await sleep(7000);
  }
}
const st = await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,240)`);
console.log('page:', st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_t5c.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

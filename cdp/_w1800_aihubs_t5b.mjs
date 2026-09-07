// win1800 aihubs.ai t5 复放 (aitoolsdirectory.vip)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('aihubs'));
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');
// no navigate
await sleep(2500);

const P = {
  link: 'https://aitoolsdirectory.vip/',
  name: 'AI Tools Directory',
  desc: 'Curated directory of artificial intelligence tools for work and creativity. Reviewed listings across image, video, writing and code assistants with pricing and feature highlights.',
  intro: '## Find the right AI tool faster\n\nAI Tools Directory is a curated catalog of artificial intelligence tools across image generation, video editing, copywriting, coding assistants and productivity suites. Every listing carries a short review, pricing model and standout features so teams can compare options in minutes.\n\n### Highlights\n\n- Hand reviewed listings across ten categories\n- Pricing and feature comparison at a glance\n- Weekly additions with an editor newsletter\n- Submit your own AI product for review\n\nBuilt for founders, marketers and teams hunting for their next tool without trial and error.'
};

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) { console.log('JS-ERR:', (r.exceptionDetails.exception?.description || '').slice(0, 150)); return undefined; }
  return r.result ? r.result.value : undefined;
};

// 1) 文本字段(desc ≤256!)
const r1 = await ev(`(function(){
  var PP = ${JSON.stringify(P)};
  function set(el,val){
    var proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;
    var s=Object.getOwnPropertyDescriptor(proto,'value').set;
    s.call(el,val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  var els=[...document.querySelectorAll('input,textarea')];
  var link=els.find(function(e){ return /link to your/i.test(e.placeholder||''); }) || els[0];
  var name=els.find(function(e){ return /name of your/i.test(e.placeholder||''); }) || els[1];
  var tas=[...document.querySelectorAll('textarea')];
  var desc=tas.find(function(t){ return /brief description/i.test(t.placeholder||''); });
  set(link,PP.link); set(name,PP.name); set(desc,PP.desc);
  return JSON.stringify({name:name.value, descLen:desc.value.length});
})()`);
console.log('fields:', r1);

// 2) CodeMirror intro (打完复验)
const loc = await ev(`(function(){
  var walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    var n=walker.currentNode;
    if(/content here/.test(n.textContent)){
      var r=n.parentElement.getBoundingClientRect();
      if(r.width>0) return JSON.stringify({x:r.x+30, y:r.y+r.height/2});
    }
  }
  return 'NF';
})()`);
if (loc && loc !== 'NF') {
  const d = JSON.parse(loc);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: d.x, y: d.y });
  await sleep(250);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: d.x, y: d.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: d.x, y: d.y, button: 'left', clickCount: 1 });
  await sleep(1000);
  await cdp.send('Input.insertText', { text: P.intro });
  await sleep(1000);
}
console.log('intro present:', await ev(`document.body.innerText.indexOf('Find the right AI tool')>=0`));

// 3) Categories + Tags
async function pickDropdown(re, word, want, takeN) {
  const trig = await ev(`(function(){
    var cand=[...document.querySelectorAll('button,[role=combobox]')].find(function(b){
      return ${re}.test(b.innerText||b.textContent||'');
    });
    if(!cand) return 'NF';
    cand.scrollIntoView({block:'center'});
    var r=cand.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
  })()`);
  if (!trig || trig === 'NF') { console.log('trigger NF', re); return; }
  const t = JSON.parse(trig);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await sleep(250);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await sleep(2000);
  const si = await ev(`(function(){
    var s=[...document.querySelectorAll('[role=dialog] input,[data-radix-popper-content-wrapper] input')].find(function(i){
      var r=i.getBoundingClientRect(); return r.width>50;
    });
    if(!s) return 'NO';
    s.focus(); return 'OK';
  })()`);
  if (si !== 'OK') { console.log('search NF', re); return; }
  await cdp.send('Input.insertText', { text: word });
  await sleep(1800);
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
  try { arr = JSON.parse(opts); } catch(e) { console.log('opts bad:', opts); }
  for (const o of arr) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: o.x, y: o.y });
    await sleep(150);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    console.log('picked:', o.t);
    await sleep(700);
  }
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);
}

await pickDropdown('/select categor/i', 'directory', '/director/i', 1);
await pickDropdown('/select tag/i', 'ai tool', '/ai tool|directory|artificial/i', 2);

// 4) 上传
await cdp.send('DOM.enable');
const doc = await cdp.send('DOM.getDocument');
const q = await cdp.send('DOM.querySelectorAll', { selector: 'input[type=file]', nodeId: doc.root.nodeId });
await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/logo-500.png'], nodeId: q.nodeIds[0] });
await sleep(1500);
await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/avg-banner-16x9.png'], nodeId: q.nodeIds[1] });
await sleep(2500);

// 5) 提交
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
    await sleep(200);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    console.log('submitted');
    await sleep(2500);
  } else console.log('submit disabled — 查缺项');
}
const st = await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,260)`);
console.log('page:', st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_t5.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

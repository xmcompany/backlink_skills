// win1800 aihubs.ai t4 复放 (aiimageeditorfree.com)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('aihubs'));
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://aihubs.ai/submit' });
await sleep(5000);

const P = {
  link: 'https://aiimageeditorfree.com/',
  name: 'AI Image Editor Free',
  desc: 'Browser based AI photo editor that is free to use with no signup wall. Clean up product shots and personal photos with background removal, object cleanup and smart relighting. Text prompts drive precise edits and exports keep the original resolution, watermark free.',
  intro: '## Edit photos by describing the change\n\nAI Image Editor Free runs fully in the browser. Upload a photo, type what you want changed and preview the result in seconds. Retouch portraits, swap backgrounds and clean up product shots without a desktop tutorial.\n\n### Highlights\n\n- Text prompt driven editing\n- Background removal and object cleanup\n- Watermark free exports at original resolution\n- No account required to start\n\nNew editing styles are added every week for stores, listings and social posts.'
};

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) console.log('JS-ERR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails).slice(0, 200));
  return r.result ? r.result.value : undefined;
};

// 1) 文本字段
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
  return JSON.stringify({link:link.value.slice(0,35), name:name.value, descLen:desc.value.length});
})()`);
console.log('fields:', r1);

// 2) CodeMirror intro
const loc = await ev(`(function(){
  var walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    var n=walker.currentNode;
    if(/content here/.test(n.textContent)){
      var r=n.parentElement.getBoundingClientRect();
      return JSON.stringify({x:r.x+30, y:r.y+r.height/2});
    }
  }
  return 'NF';
})()`);
if (loc !== 'NF') {
  const d = JSON.parse(loc);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: d.x, y: d.y });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: d.x, y: d.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: d.x, y: d.y, button: 'left', clickCount: 1 });
  await sleep(600);
  await cdp.send('Input.insertText', { text: P.intro });
  console.log('intro typed');
  await sleep(800);
} else console.log('editor NF');

// 3) Categories + Tags 下拉
async function pickDropdown(re, word, want, takeN) {
  const trig = await ev(`(function(){
    var cand=[...document.querySelectorAll('button,[role=combobox]')].find(function(b){
      return ${re}.test(b.innerText||b.textContent||'');
    });
    if(!cand) return 'NF';
    var r=cand.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
  })()`);
  if (trig === 'NF') { console.log('trigger NF', re); return; }
  const t = JSON.parse(trig);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await sleep(1500);
  const si = await ev(`(function(){
    var s=[...document.querySelectorAll('[role=dialog] input,[data-radix-popper-content-wrapper] input')].find(function(i){
      var r=i.getBoundingClientRect(); return r.width>50;
    });
    if(!s) return 'NF';
    s.focus(); return 'OK';
  })()`);
  if (si !== 'OK') { console.log('search NF', re); return; }
  await cdp.send('Input.insertText', { text: word });
  await sleep(1500);
  const opts = await ev(`(function(){
    var wrap=[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].pop();
    if(!wrap) return '[]';
    var items=[...wrap.querySelectorAll('[role=option],[cmdk-item],[role=command-item]')];
    var trigY=${t.y};
    var hits=items.filter(function(o){
      var r=o.getBoundingClientRect();
      return r.y>trigY && r.width>50 && ${want}.test(o.textContent);
    });
    return JSON.stringify(hits.slice(0,takeN).map(function(o){
      var r=o.getBoundingClientRect();
      return {t:o.textContent.trim().slice(0,30), x:r.x+20, y:r.y+r.height/2};
    }));
  })()`);
  const arr = JSON.parse(opts);
  for (const o of arr) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 });
    console.log('picked:', o.t);
    await sleep(600);
  }
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
}

await pickDropdown('/select categor/i', 'image', '/image|edit|design/i', 1);
await pickDropdown('/select tag/i', 'photo', '/photo|image/i', 2);

// 4) 上传 icon+image
await cdp.send('DOM.enable');
const doc = await cdp.send('DOM.getDocument');
const q = await cdp.send('DOM.querySelectorAll', { selector: 'input[type=file]', nodeId: doc.root.nodeId });
await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/aie-logo-500.png'], nodeId: q.nodeIds[0] });
await sleep(1500);
await cdp.send('DOM.setFileInputFiles', { files: ['D:/Github/backlink_skills/assets/avg-banner-16x9.png'], nodeId: q.nodeIds[1] });
await sleep(2500);
const chk = await ev(`JSON.stringify([...document.querySelectorAll('input[type=file]')].map(function(f){ return [...f.files].map(function(x){return x.name;}); }))`);
console.log('files:', chk);
console.log('STAGE1 DONE');
process.exit(0);

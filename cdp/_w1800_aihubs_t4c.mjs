// win1800 aihubs t4: 标签重选+提交(带守卫)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

const trig = await ev(`(function(){
  var cand=[...document.querySelectorAll('button,[role=combobox]')].find(function(b){
    return /select tag/i.test(b.innerText||b.textContent||'');
  });
  if(!cand) return 'NF';
  cand.scrollIntoView({block:'center'});
  var r=cand.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
})()`);
if (!trig || trig === 'NF') { console.log('trigger NF'); process.exit(1); }
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
console.log('open:', si);
if (si === 'OK') {
  await cdp.send('Input.insertText', { text: 'photo' });
  await sleep(1800);
  const opts = await ev(`(function(){
    try{
      var wrap=[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].pop();
      if(!wrap) return '[]';
      var items=[...wrap.querySelectorAll('[role=option],[cmdk-item],[role=command-item]')];
      var trigY=${t.y};
      var hits=items.filter(function(o){
        var r=o.getBoundingClientRect();
        return r.y>trigY && r.width>50 && /photo|image/i.test(o.textContent);
      });
      return JSON.stringify(hits.slice(0,2).map(function(o){
        var r=o.getBoundingClientRect();
        return {t:o.textContent.trim().slice(0,30), x:r.x+20, y:r.y+r.height/2};
      }));
    }catch(e){ return 'ERR:'+e.message; }
  })()`);
  console.log('opts:', opts);
  if (opts && typeof opts === 'string' && opts[0] === '[') {
    const arr = JSON.parse(opts);
    for (const o of arr) {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: o.x, y: o.y });
      await sleep(150);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 });
      console.log('picked:', o.t);
      await sleep(700);
    }
  }
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);
}
const chip = await ev(`(function(){
  var t=document.body.innerText;
  return (t.indexOf('AI Image Enhancer')>=0||t.indexOf('AI Photography')>=0||t.indexOf('Photo')>=0) + '/' + (t.indexOf('Must select at least one tag')>=0?'STILL_ERR':'ok');
})()`);
console.log('chips:', chip);
const r2 = await ev(`(function(){
  var btns=[...document.querySelectorAll('button')];
  var sub=btns.find(function(b){ return /^submit$/i.test((b.innerText||'').trim()); });
  if(!sub) return 'NF';
  sub.scrollIntoView({block:'center'});
  var r=sub.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, dis:sub.disabled});
})()`);
console.log('btn:', r2);
if (r2 && r2 !== 'NF') {
  const s = JSON.parse(r2);
  if (!s.dis) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.x, y: s.y });
    await sleep(200);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
    console.log('submitted');
    await sleep(6000);
  }
}
const txt = await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,260)`);
console.log('page:', txt);
process.exit(0);

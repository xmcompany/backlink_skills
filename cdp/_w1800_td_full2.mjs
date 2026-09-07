// win1800 techdirectory 全新链单脚本: 开get-listed→FREE→注册表单→提交
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const created = await (await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' })).json();
await (await fetch(`http://127.0.0.1:9224/json/activate/${created.id}`)).text();
const cdp = await CDP.attachById(created.id);
await cdp.send('Page.enable');
await sleep(2500);

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) { console.log('JS-ERR:', (r.exceptionDetails.exception?.description || '').slice(0, 160)); return undefined; }
  return r.result ? r.result.value : undefined;
};

await cdp.send('Page.navigate', { url: 'https://www.techdirectory.io/checkout/basic' });
await sleep(8000);
console.log('at:', await ev(`location.href.slice(0,80)`));

await sleep(2000); console.log('at:', await ev(`location.href.slice(0,80)`));


// 注册表单一口气 fill+click
const r2 = await ev(`(function(){
  function set(sel,val){
    var el=document.querySelector(sel);
    if(!el) return 'NF:'+sel;
    var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    s.call(el,val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  }
  var a=set('input[name="email"]','td.atd@387654.com');
  var b=set('input[name="email_confirm"]','td.atd@387654.com');
  var c=set('input[name="password"]','Xx@Td26!Xm');
  var d=set('input[name="password_confirm"]','Xx@Td26!Xm');
  var btns=[...document.querySelectorAll('input[type=submit],input[type=image],button')].filter(function(e){
    return e.getBoundingClientRect().width>0 && /signup|create|register|submit/i.test((e.name||'')+(e.value||'')+(e.innerText||''));
  });
  if(!btns.length) return JSON.stringify({st:'btnNF', a:a, d:d});
  var el=btns[0];
  el.scrollIntoView({block:'center'});
  var r=el.getBoundingClientRect();
  return JSON.stringify({st:'ok', x:r.x+r.width/2, y:r.y+r.height/2, n:(el.name||el.innerText||'').slice(0,25), a:a});
})()`);
console.log('fill:', r2);
let s2;
try { s2 = JSON.parse(r2); } catch(e) { s2 = null; }
if (s2 && s2.st === 'ok') {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(s2.x), y: Math.round(s2.y) });
  await sleep(300);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(s2.x), y: Math.round(s2.y), button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(s2.x), y: Math.round(s2.y), button: 'left', clickCount: 1 });
  console.log('submitted:', s2.n);
  await sleep(9000);
}
const st = await ev(`JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.replace(/\\s+/g,' ').slice(0,260)})`);
console.log(st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_td_full.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

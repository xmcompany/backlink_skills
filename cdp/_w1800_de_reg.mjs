// win1800 directoryeasy 注册
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('directoryeasy'));
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) { console.log('JS-ERR:', (r.exceptionDetails.exception?.description || '').slice(0, 160)); return undefined; }
  return r.result ? r.result.value : undefined;
};

const r = await ev(`(function(){
  function set(el,val){
    var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    s.call(el,val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  var g=function(n){ return document.querySelector('input[name='+n+']'); };
  set(g('name'),'Leo Xm');
  set(g('email'),'de.avg@387654.com');
  set(g('password'),'Xx@De26!Xm');
  set(g('confirmPassword'),'Xx@De26!Xm');
  return 'filled:'+g('email').value;
})()`);
console.log(r);

await sleep(5000);
const alt = await ev(`(function(){
  try{
    var cb=document.querySelector('input[name^=altcha_checkbox]');
    if(!cb) return JSON.stringify({st:'NF'});
    var w=cb.closest('.altcha');
    var hid=w?w.querySelector('input[name=altcha]'):null;
    return JSON.stringify({st:'ok', checked:cb.checked, payload: hid&&hid.value?hid.value.slice(0,15):null});
  }catch(e){ return JSON.stringify({st:'ERR:'+e.message}); }
})()`);
console.log('altcha:', alt);
const a = JSON.parse(alt);
if (a.st === 'ok' && !a.checked) {
  const cb2 = await ev(`(function(){
    var cb=document.querySelector('input[name^=altcha_checkbox]');
    var r=cb.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
  })()`);
  const p = JSON.parse(cb2);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await sleep(250);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  console.log('altcha clicked');
  await sleep(4000);
  const chk = await ev(`(function(){
    var cb=document.querySelector('input[name^=altcha_checkbox]');
    var w=cb.closest('.altcha');
    var hid=w?w.querySelector('input[name=altcha]'):null;
    return JSON.stringify({checked:cb.checked, payload: hid&&hid.value?hid.value.slice(0,15):null});
  })()`);
  console.log('altcha after:', chk);
}

const b = await ev(`(function(){
  var btn=document.querySelector('button[type=submit]');
  var r=btn.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, dis:btn.disabled, txt:(btn.innerText||'').trim().slice(0,20)});
})()`);
const sb = JSON.parse(b);
console.log('btn:', sb.txt, 'dis:', sb.dis);
if (!sb.dis) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sb.x, y: sb.y });
  await sleep(200);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sb.x, y: sb.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sb.x, y: sb.y, button: 'left', clickCount: 1 });
  console.log('submit clicked');
  await sleep(8000);
}
const st = await ev(`JSON.stringify({url:location.href.slice(0,85), txt:document.body.innerText.replace(/\\s+/g,' ').slice(0,220)})`);
console.log(st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_de_reg.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

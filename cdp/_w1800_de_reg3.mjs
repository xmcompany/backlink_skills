// win1800 directoryeasy 注册终试
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
  var g=function(n){ return document.querySelector('input[name='+JSON.stringify(n)+']'); };
  set(g('name'),'Leo Xm');
  set(g('email'),'de.avg@387654.com');
  set(g('password'),'Xx@De26!Xm');
  set(g('confirmPassword'),'Xx@De26!Xm');
  return 'filled:'+g('email').value;
})()`);
console.log(r);

const rb = await ev(`(function(){
  var labs=[...document.querySelectorAll('label')].filter(function(l){ return /not a robot/i.test(l.textContent); });
  if(!labs.length) return JSON.stringify({st:'NF'});
  var r=labs[0].getBoundingClientRect();
  return JSON.stringify({st:'ok', x:r.x+r.width/2, y:r.y+r.height/2});
})()`);
console.log('robot:', rb);
let p;
try { p = JSON.parse(rb); } catch(e) { p = { st: 'parse' }; }
if (p.st === 'ok') {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(p.x - 40), y: Math.round(p.y) });
  await sleep(300);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(p.x - 40), y: Math.round(p.y), button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(p.x - 40), y: Math.round(p.y), button: 'left', clickCount: 1 });
  console.log('robot clicked');
  await sleep(9000);
  const chk = await ev(`(function(){
    var hid=document.querySelector('input[name=altcha]');
    return JSON.stringify({payload: hid&&hid.value?'yes':'no'});
  })()`);
  console.log('altcha payload:', chk);
}

const b = await ev(`(function(){
  var btns=[...document.querySelectorAll('button')];
  var btn=btns.find(function(x){ return /create an account/i.test(x.innerText||''); });
  if(!btn) return 'NF';
  btn.scrollIntoView({block:'center'});
  var r=btn.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, dis:btn.disabled});
})()`);
let sb;
try { sb = JSON.parse(b); } catch(e) { sb = null; }
if (sb && !sb.dis) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(sb.x), y: Math.round(sb.y) });
  await sleep(250);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(sb.x), y: Math.round(sb.y), button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(sb.x), y: Math.round(sb.y), button: 'left', clickCount: 1 });
  console.log('submit clicked');
  await sleep(9000);
} else console.log('btn skip:', b);

const st = await ev(`JSON.stringify({url:location.href.slice(0,85), txt:document.body.innerText.replace(/\\s+/g,' ').slice(0,220)})`);
console.log(st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_de_reg3.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

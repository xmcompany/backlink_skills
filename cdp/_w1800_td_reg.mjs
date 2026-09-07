// win1800 techdirectory 免费注册
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('techdirectory'));
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
  set(g('email'),'td.atd@387654.com');
  set(g('email_confirm'),'td.atd@387654.com');
  set(g('password'),'Xx@Td26!Xm');
  set(g('password_confirm'),'Xx@Td26!Xm');
  var btn=document.querySelector('input[name^=signup_free]');
  if(!btn) return 'btnNF';
  btn.scrollIntoView({block:'center'});
  var r=btn.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, email:g('email').value});
})()`);
console.log(r);
let p;
try { p = JSON.parse(r); } catch(e) { p = null; }
if (p && p.x) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(p.x), y: Math.round(p.y) });
  await sleep(250);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(p.x), y: Math.round(p.y), button: 'left', clickCount: 1 });
  console.log('signup clicked');
  await sleep(9000);
}
const st = await ev(`JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.replace(/\\s+/g,' ').slice(0,260)})`);
console.log(st);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_td_reg.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

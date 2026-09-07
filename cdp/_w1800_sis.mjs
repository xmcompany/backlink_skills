// win1800 phpLD-reCAPTCHA sisters 通用脚本
// 用法: node _w1800_sis.mjs fill <domain> <t10|t4|t5>
//       node _w1800_sis.mjs click <domain>          (点anchor+截挑战图)
//       node _w1800_sis.mjs solve <domain> "x,y;x,y" (点格+验证+token+提交)
//       node _w1800_sis.mjs shot <domain>
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const mode = process.argv[2];
const domain = process.argv[3];
const task = process.argv[4] || 't10';

const PAYLOADS = {
  t10: {
    TITLE: 'QRCodeGenerator VIP',
    URL: 'https://qrcodegenerator.vip/',
    DESCRIPTION: 'Free online QR code generator with AI beautification for marketers, small businesses and developers. Create fully custom QR codes with colors, gradients, logos, frames and error-correction levels in a live preview. Static codes never expire, while dynamic codes add editable destinations plus scan analytics for time, location, device and campaign. Batch generation renders hundreds of codes from CSV input and a documented REST API automates creation inside your own apps. High resolution, print ready, exportable as PNG or SVG with no watermark or hidden fee.',
  },
  t4: {
    TITLE: 'AI Image Editor Free',
    URL: 'https://aiimageeditorfree.com/',
    DESCRIPTION: 'Browser based AI photo editor that is free to use with no signup wall. Clean up product shots and personal photos with background removal, object cleanup and smart relighting. Text prompts drive precise edits, so retouching a portrait or swapping a backdrop takes seconds instead of a desktop tutorial. Every feature runs on the client side preview before export, keeps original resolution and exports watermark free PNG and JPG files that are ready for stores, listings and social posts.',
  },
  t5: {
    TITLE: 'AI Tools Directory',
    URL: 'https://aitoolsdirectory.vip/',
    DESCRIPTION: 'Curated directory of artificial intelligence tools organized by category, from image and video generation to copywriting, code assistants and productivity suites. Each listing carries a short review, pricing model and feature highlights so teams can compare options in minutes instead of days. New AI tools are added weekly and the search and filtering make it easy to find the right assistant for any workflow or budget.',
  },
};
const P = PAYLOADS[task];
const EMAIL_PREFIX = { t10: 'qrg', t4: 'aie', t5: 'atd' };
const OWNER_EMAIL = `sis.${EMAIL_PREFIX[task]}@92ng.com`;

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && t.url.includes(domain));
if (!page) {
  const created = await (await fetch(`http://127.0.0.1:9224/json/new?https://${domain}/submit.php`, { method: 'PUT' })).json();
  page = { id: created.id };
  await sleep(2500);
}
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');
await sleep(2000);

if (mode === 'fill') {
  const cur = (await cdp.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })).result.value;
  if (!/submit/.test(cur)) {
    await cdp.send('Page.navigate', { url: `https://www.${domain}/submit.php` });
    await sleep(3500);
  }
  console.log('at:', (await cdp.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })).result.value);
  const fill = await cdp.send('Runtime.evaluate', { expression: `(()=>{
    const out=[];
    const set=(sel,val)=>{
      const i=document.querySelector(sel);
      if(!i) { out.push('NF:'+sel); return; }
      const proto=i.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;
      const s=Object.getOwnPropertyDescriptor(proto,'value').set;
      s.call(i,val);
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      out.push('OK:'+sel);
    };
    set('input[name=TITLE]', ${JSON.stringify(P.TITLE)});
    set('input[name=URL]', ${JSON.stringify(P.URL)});
    set('textarea[name=DESCRIPTION]', ${JSON.stringify(P.DESCRIPTION)});
    set('input[name=OWNER_NAME]', 'Leo Xm');
    set('input[name=OWNER_EMAIL]', ${JSON.stringify(OWNER_EMAIL)});
    // LINK_TYPE radio 选 normal/free
    const rs=[...document.querySelectorAll('input[name=LINK_TYPE]')];
    if(rs.length){
      const pick=rs.find(r=>/normal|free/i.test(r.parentElement.innerText||'')) || rs.find(r=>/1|2/.test(r.value));
      if(pick && !pick.checked){ pick.click(); }
      out.push('LINK_TYPE='+rs.map(r=>r.value+(r.checked?'*':'')).join('|'));
    }
    // agree checkbox
    const a=document.querySelector('input[name=agree],input[name=AGREERULES]');
    if(a){ if(!a.checked) a.click(); out.push('agree='+a.checked); }
    return JSON.stringify(out);
  })()`, returnByValue: true });
  console.log('fill:', fill.result.value);

  const cats = await cdp.send('Runtime.evaluate', { expression: `(()=>{
    const s=document.querySelector('select[name=CATEGORY_ID]');
    if(!s) return 'NF';
    const opts=[...s.options].map(o=>o.value+':'+o.text.trim().slice(0,60));
    return opts.filter(t=>/ai|artificial|intelligen|internet|comput|softw|directo/i.test(t)).slice(0,40).join(' ;; ');
  })()`, returnByValue: true });
  console.log('cats:', cats.result.value);
}

if (mode === 'click') {
  const rc = await cdp.send('Runtime.evaluate', { expression: `(function(){ var f=document.querySelector('iframe[src*=recaptcha][src*=anchor]'); if(!f) return 'NF'; f.scrollIntoView({block:'center'}); var r=f.getBoundingClientRect(); return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height}); })()`, returnByValue: true });
  if (rc.result.value === 'NF') { console.log('anchor NF'); process.exit(1); }
  const d = JSON.parse(rc.result.value);
  const cx = d.x + 28, cy = d.y + d.h / 2;
  await sleep(300);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  console.log('anchor clicked at', Math.round(cx), Math.round(cy));
  await sleep(3500);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`D:/Github/seoadminB/storage/_w1800_${domain.split('.')[0]}_chal.png`, Buffer.from(shot.data, 'base64'));
  const bf = await cdp.send('Runtime.evaluate', { expression: `JSON.stringify((function(){ var f=[...document.querySelectorAll('iframe[src*=recaptcha]')].find(function(f){return /bframe/.test(f.src)}); if(!f) return {b:false}; var r=f.getBoundingClientRect(); return {b:true, x:r.x, y:r.y, w:r.width, h:r.height}; })())`, returnByValue: true });
  console.log('bframe:', bf.result.value);
  const tok = await cdp.send('Runtime.evaluate', { expression: `document.querySelector('#g-recaptcha-response') ? document.querySelector('#g-recaptcha-response').value.length : -1`, returnByValue: true });
  console.log('token_len:', tok.result.value);
}

// 清广告覆盖层: 从命中点爬到body子层删除(带recaptcha守卫)
const CLEAN_EXPR = `(function(){
  var out={removed:[], hits:{}};
  var hasRC=function(el){ return el.querySelector && el.querySelector('iframe[src*=recaptcha]'); };
  var probe=function(x,y){
    var e=document.elementFromPoint(x,y);
    if(!e) return 'null';
    var f=e.tagName==='IFRAME'?e:e.closest('iframe');
    return f? ('iframe:'+f.src.slice(0,70)) : (e.tagName+'.'+(e.className||'').toString().slice(0,30));
  };
  var pts=[[667,300],[400,300],[900,300]];
  pts.forEach(function(p){
    var x=p[0], y=p[1];
    var e=document.elementFromPoint(x,y);
    if(!e) return;
    var src=(e.tagName==='IFRAME'?e.src:(e.querySelector&&e.querySelector('iframe')?e.querySelector('iframe').src:''))||'';
    if(/recaptcha/.test(src)) return;
    var top=e;
    while(top.parentElement && top.parentElement!==document.body && top.parentElement!==document.documentElement) top=top.parentElement;
    if(top && top!==document.body && !hasRC(top)){ out.removed.push((top.tagName)+'#'+(top.id||'').slice(0,20)); top.remove(); }
  });
  out.hits.tile=probe(667,300);
  return JSON.stringify(out);
})()`;

if (mode === 'clean') {
  const r = await cdp.send('Runtime.evaluate', { expression: CLEAN_EXPR, returnByValue: true });
  console.log('clean:', r.result.value);
}

if (mode === 'cat') {
  const catVal = process.argv[5];
  const r = await cdp.send('Runtime.evaluate', { expression: `(()=>{
    const s=document.querySelector('select[name=CATEGORY_ID]');
    if(!s) return 'NF';
    s.value=${JSON.stringify(catVal)};
    s.dispatchEvent(new Event('change',{bubbles:true}));
    return 'CAT='+s.value;
  })()`, returnByValue: true });
  console.log(r.result.value);
  await sleep(500);
  // 接着点 anchor + 截挑战
  const rc = await cdp.send('Runtime.evaluate', { expression: `(function(){ var f=document.querySelector('iframe[src*=recaptcha][src*=anchor]'); if(!f) return 'NF'; f.scrollIntoView({block:'center'}); var r=f.getBoundingClientRect(); return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height}); })()`, returnByValue: true });
  if (rc.result.value === 'NF') { console.log('anchor NF'); process.exit(1); }
  const d = JSON.parse(rc.result.value);
  const cx = d.x + 28, cy = d.y + d.h / 2;
  await sleep(300);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  console.log('anchor clicked at', Math.round(cx), Math.round(cy));
  await sleep(3500);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`D:/Github/seoadminB/storage/_w1800_${domain.split('.')[0]}_chal.png`, Buffer.from(shot.data, 'base64'));
  const bf = await cdp.send('Runtime.evaluate', { expression: `JSON.stringify((function(){ var f=[...document.querySelectorAll('iframe[src*=recaptcha]')].find(function(f){return /bframe/.test(f.src)}); if(!f) return {b:false}; var r=f.getBoundingClientRect(); return {b:true, x:r.x, y:r.y, w:r.width, h:r.height}; })())`, returnByValue: true });
  console.log('bframe:', bf.result.value);
  const tok = await cdp.send('Runtime.evaluate', { expression: `document.querySelector('#g-recaptcha-response') ? document.querySelector('#g-recaptcha-response').value.length : -1`, returnByValue: true });
  console.log('token_len:', tok.result.value);
}

if (mode === 'solve') {
  // 前置清广告层+命中诊断
  const cl = await cdp.send('Runtime.evaluate', { expression: CLEAN_EXPR, returnByValue: true });
  console.log('clean:', cl.result.value);
  const cells = (process.argv[5] || '').split(';').filter(Boolean).map(s => s.split(',').map(Number));
  for (const [x, y] of cells) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sleep(120);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    console.log('clicked', x, y);
    await sleep(400);
  }
  // 验证按钮（bframe 右下 0.83, h-30）
  const bf = await cdp.send('Runtime.evaluate', { expression: `(function(){ var f=[...document.querySelectorAll('iframe[src*=recaptcha]')].find(function(f){return /bframe/.test(f.src)}); var r=f.getBoundingClientRect(); return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height}); })()`, returnByValue: true });
  const b = JSON.parse(bf.result.value);
  const vx = b.x + b.w * 0.83, vy = b.y + b.h - 30;
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: vx, y: vy, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: vx, y: vy, button: 'left', clickCount: 1 });
  console.log('verify clicked at', Math.round(vx), Math.round(vy));
  let token = 0;
  for (let i = 0; i < 10; i++) {
    await sleep(1200);
    const st = await cdp.send('Runtime.evaluate', { expression: `(function(){ var t=document.querySelector('#g-recaptcha-response'); return t? t.value.length : 0; })()`, returnByValue: true });
    token = st.result.value;
    console.log('poll token:', token);
    if (token > 100) break;
  }
  if (token > 100) {
    const sb = await cdp.send('Runtime.evaluate', { expression: `(function(){ var t=document.querySelector('input[name=TITLE]'); var f=t?t.closest('form'):document; var el=f.querySelector('input[type=submit],button[type=submit],input[name=submit],button[name=submit]'); if(!el) return 'NF'; el.scrollIntoView({block:'center'}); var r=el.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, label:el.value||el.innerText||el.name}); })()`, returnByValue: true });
    if (sb.result.value === 'NF') { console.log('submit btn NF'); process.exit(1); }
    const xy = JSON.parse(sb.result.value);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xy.x, y: xy.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xy.x, y: xy.y, button: 'left', clickCount: 1 });
    console.log('SUBMIT clicked:', xy.label);
    await sleep(4500);
    const after = await cdp.send('Runtime.evaluate', { expression: `document.body.innerText.replace(/\\s+/g,' ').slice(0,300)`, returnByValue: true });
    console.log('after:', after.result.value);
  } else {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`D:/Github/seoadminB/storage/_w1800_${domain.split('.')[0]}_fail.png`, Buffer.from(shot.data, 'base64'));
    console.log('NO TOKEN - screenshot saved');
  }
}

if (mode === 'shot') {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`D:/Github/seoadminB/storage/_w1800_${domain.split('.')[0]}_shot.png`, Buffer.from(shot.data, 'base64'));
  const txt = await cdp.send('Runtime.evaluate', { expression: `document.body.innerText.replace(/\\s+/g,' ').slice(0,400)`, returnByValue: true });
  console.log('text:', txt.result.value);
}
process.exit(0);

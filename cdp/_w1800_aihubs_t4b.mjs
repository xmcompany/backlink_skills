// win1800 aihubs t4 修复轮: intro 重打 + 下拉重选(带验证)
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
  if (r.exceptionDetails) console.log('JS-ERR:', JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails).slice(0, 150));
  return r.result ? r.result.value : undefined;
};

const INTRO = '## Edit photos by describing the change\n\nAI Image Editor Free runs fully in the browser. Upload a photo, type what you want changed and preview the result in seconds. Retouch portraits, swap backgrounds and clean up product shots without a desktop tutorial.\n\n### Highlights\n\n- Text prompt driven editing\n- Background removal and object cleanup\n- Watermark free exports at original resolution\n- No account required to start\n\nNew editing styles are added every week for stores, listings and social posts.';

// 1) intro: 若空则重打
const hasIntro = await ev(`document.body.innerText.indexOf('Edit photos by describing')>=0`);
console.log('intro present:', hasIntro);
if (!hasIntro) {
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
  console.log('editor loc:', loc);
  if (loc !== 'NF') {
    const d = JSON.parse(loc);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: d.x, y: d.y });
    await sleep(200);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: d.x, y: d.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: d.x, y: d.y, button: 'left', clickCount: 1 });
    await sleep(1000);
    // 验证聚焦: CodeMirror 有 cursor
    await cdp.send('Input.insertText', { text: INTRO });
    await sleep(1000);
    console.log('intro retyped:', await ev(`document.body.innerText.indexOf('Edit photos by describing')>=0`));
  }
}

// 2) 下拉通用(带移动+开启验证+重试)
async function pickDropdown(re, word, want, takeN) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const trig = await ev(`(function(){
      var cand=[...document.querySelectorAll('button,[role=combobox]')].find(function(b){
        return ${re}.test(b.innerText||b.textContent||'');
      });
      if(!cand) return 'NF';
      cand.scrollIntoView({block:'center'});
      var r=cand.getBoundingClientRect();
      return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
    })()`);
    if (trig === 'NF') { console.log('trigger NF', re); return false; }
    const t = JSON.parse(trig);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
    await sleep(250);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    await sleep(2000);
    const opened = await ev(`(function(){
      var s=[...document.querySelectorAll('[role=dialog] input,[data-radix-popper-content-wrapper] input')].find(function(i){
        var r=i.getBoundingClientRect(); return r.width>50;
      });
      if(!s) return 'NO';
      s.focus(); return 'OK';
    })()`);
    console.log('dropdown open attempt', attempt, ':', opened);
    if (opened !== 'OK') continue;
    await cdp.send('Input.insertText', { text: word });
    await sleep(1800);
    const opts = await ev(`(function(){
      try{
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
      }catch(e){ return 'ERR:'+e.message; }
    })()`);
    if (!opts || typeof opts !== 'string' || opts[0] !== '[' && opts.indexOf('ERR') !== 0) { console.log('opts eval fail:', opts); return false; }
    if (opts.indexOf('ERR') === 0) { console.log('opts err:', opts); return false; }
    const arr = JSON.parse(opts);
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
    return arr.length > 0;
  }
  return false;
}

await pickDropdown('/select categor/i', 'image', '/image|edit|design/i', 1);
await pickDropdown('/select tag/i', 'photo', '/photo|image/i', 2);

const final = await ev(`(function(){
  var t=document.body.innerText;
  return JSON.stringify({hasCat:/^(Video|Image|Design|Writing)/m.test(t), catSel:(t.match(/Categories ([^\\n]{0,30})/)||[])[1], intro: t.indexOf('Edit photos by describing')>=0});
})()`);
console.log('final:', final);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_t4_state.png', Buffer.from(shot.data, 'base64'));
process.exit(0);

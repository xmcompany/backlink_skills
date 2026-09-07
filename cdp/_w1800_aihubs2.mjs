// win1800 aihubs.ai t1 全流程: node _w1800_aihubs2.mjs <stage>
// stage: fields | cats | tags | files | submit
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const stage = process.argv[2] || 'fields';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && t.url.includes('aihubs'));
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');
await sleep(1200);

const ev = async (expr) => {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) console.log('JS-ERR:', JSON.stringify(r.exceptionDetails).slice(0, 200));
  return r.result ? r.result.value : undefined;
};

if (stage === 'fields') {
  const DESC = 'Free AI video generator that turns text prompts and images into short videos right in the browser. No signup wall and no watermark, with clean MP4 exports ready for social, ads and product pages.';
  const INTRO = '## Turn text into video\n\nAI Video Generator Free is an online tool that converts text prompts, scripts and still images into short videos. Paste a prompt, pick a motion style and preview the result in seconds.\n\n### Highlights\n\n- Text to video and image to video modes\n- No account required for standard generation\n- Clean, watermark free MP4 output\n- Runs fully in the browser on desktop and mobile\n\nNew templates and motion styles are added every week, so there is always a fresh look to try for product demos, social clips and storytelling.';
  const r = await ev(`(function(){
    var P = ${JSON.stringify({ link: 'https://aivideogeneratorfree.org/', name: 'AI Video Generator Free', desc: DESC, intro: INTRO })};
    function set(el,val){
      var proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;
      var s=Object.getOwnPropertyDescriptor(proto,'value').set;
      s.call(el,val);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    var els=[...document.querySelectorAll('input,textarea')];
    var link=els[0], name=els[1];
    var tas=[...document.querySelectorAll('textarea')];
    var desc=tas.find(function(t){ return /brief description/i.test(t.placeholder||''); });
    var intro=tas.find(function(t){ var r=t.getBoundingClientRect(); return r.width>500 && r.height>10 && t!==desc; });
    set(link,P.link); set(name,P.name); set(desc,P.desc);
    if(intro) set(intro,P.intro);
    return JSON.stringify({link:link.value.slice(0,30), name:name.value.slice(0,30), descLen:desc.value.length, introFound:!!intro, introLen:intro?intro.value.length:-1});
  })()`);
  console.log('fields:', r);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_fields.png', Buffer.from(shot.data, 'base64'));
}

if (stage === 'cats' || stage === 'tags') {
  const word = stage === 'cats' ? 'video' : 'video';
  const re = stage === 'cats' ? '/select categor/i' : '/select tag/i';
  // 1) 找触发钮
  const trig = await ev(`(function(){
    var cand=[...document.querySelectorAll('button,[role=combobox],[role=button],div[class*=trigger],span')].find(function(b){
      return ${re}.test(b.innerText||b.textContent||'');
    });
    if(!cand) return 'NF';
    cand.scrollIntoView({block:'center'});
    var r=cand.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
  })()`);
  console.log('trigger:', trig);
  if (trig !== 'NF') {
    const t = JSON.parse(trig);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
    await sleep(150);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    await sleep(1500);
    // 2) 下拉内搜索框输入
    const si = await ev(`(function(){
      var s=[...document.querySelectorAll('[role=dialog] input,[cmdk-root] input,[data-radix-popper-content-wrapper] input')].find(function(i){
        var r=i.getBoundingClientRect(); return r.width>50;
      });
      if(!s) return 'NF';
      s.focus();
      return 'OK';
    })()`);
    console.log('search input:', si);
    if (si === 'OK') {
      await cdp.send('Input.insertText', { text: word });
      await sleep(1500);
      // 3) 列选项并点前2个 video 相关(校验 y>触发钮y)
      const opts = await ev(`(function(){
        var wrap=[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].pop();
        if(!wrap) return 'NOWRAP';
        var items=[...wrap.querySelectorAll('[role=option],[cmdk-item],[role=command-item]')];
        var trigY=${t.y};
        var hits=items.filter(function(o){
          var r=o.getBoundingClientRect();
          return r.y>trigY && r.width>50 && /video/i.test(o.textContent);
        });
        return JSON.stringify(hits.slice(0,4).map(function(o){
          var r=o.getBoundingClientRect();
          return {t:o.textContent.trim().slice(0,40), x:r.x+20, y:r.y+r.height/2};
        }));
      })()`);
      console.log('options:', opts);
      const arr = JSON.parse(opts);
      for (const o of arr.slice(0, stage === 'cats' ? 1 : 2)) {
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: o.x, y: o.y });
        await sleep(120);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 });
        console.log('clicked option:', o.t);
        await sleep(700);
      }
      // 关闭下拉
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
    }
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`D:/Github/seoadminB/storage/_w1800_aihubs_${stage}.png`, Buffer.from(shot.data, 'base64'));
  }
}

if (stage === 'files') {
  // 图标 = avg-logo-500.png, 图 = avg-banner-16x9.png
  const r = await ev(`(function(){
    var fis=[...document.querySelectorAll('input[type=file]')];
    return JSON.stringify(fis.map(function(f,i){ var r=f.getBoundingClientRect(); return i+':'+f.accept.slice(0,30)+':vis='+(r.width>0); }));
  })()`);
  console.log('file inputs:', r);
  await cdp.send('DOM.enable');
  const doc = await cdp.send('DOM.getDocument');
  const iconNode = await cdp.send('DOM.querySelectorAll', { selector: 'input[type=file]', nodeId: doc.root.nodeId });
  const ids = iconNode.nodeIds;
  await cdp.send('DOM.setFileInputFiles', { files: ['D:\\\\Github\\\\backlink_skills\\\\assets\\\\avg-logo-500.png'], nodeId: ids[0] });
  await sleep(1500);
  await cdp.send('DOM.setFileInputFiles', { files: ['D:\\\\Github\\\\backlink_skills\\\\assets\\\\avg-banner-16x9.png'], nodeId: ids[1] });
  await sleep(2500);
  const chk = await ev(`(function(){
    var txt=document.body.innerText.replace(/\\s+/g,' ');
    return JSON.stringify({hasErr:/must/i.test(txt.slice(0,3000)) ? txt.match(/Must[^.]{0,60}/g) : null, uploaded:(txt.match(/(100%|avg-|logo|banner)/gi)||[]).slice(0,8)});
  })()`);
  console.log('after upload:', chk);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_files.png', Buffer.from(shot.data, 'base64'));
}

if (stage === 'submit') {
  const r = await ev(`(function(){
    var btns=[...document.querySelectorAll('button')];
    var sub=btns.find(function(b){ return /^submit$/i.test((b.innerText||'').trim()); });
    if(!sub) return 'NF';
    sub.scrollIntoView({block:'center'});
    var r=sub.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2, dis:sub.disabled});
  })()`);
  console.log('submit btn:', r);
  if (r !== 'NF') {
    const s = JSON.parse(r);
    if (!s.dis) {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.x, y: s.y });
      await sleep(150);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
      console.log('submit clicked');
      await sleep(5000);
      const after = await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,350)`);
      console.log('after:', after);
    } else console.log('submit disabled');
  }
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('D:/Github/seoadminB/storage/_w1800_aihubs_submit.png', Buffer.from(shot.data, 'base64'));
}
process.exit(0);

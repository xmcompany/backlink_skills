// win1800 aihubs.ai t1 (aivideogeneratorfree.org) 分阶段提交
// 用法: node _w1800_aihubs.mjs text|cats|tags|upload|submit
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = await import('fs');

const mode = process.argv[2] || 'text';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && t.url.includes('aihubs'));
if (!page) {
  const created = await (await fetch('http://127.0.0.1:9224/json/new?https://aihubs.ai/submit', { method: 'PUT' })).json();
  page = { id: created.id };
  await sleep(3000);
}
await (await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`)).text();
const cdp = await CDP.attachById(page.id);
await cdp.send('Page.enable');
await sleep(1500);

// 通用: 找 placeholder/label 对应的可交互元素坐标
const clickAt = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const typeText = async (text) => {
  await cdp.send('Input.insertText', { text });
};

if (mode === 'text') {
  // 刷新向导到干净态
  await cdp.send('Page.navigate', { url: 'https://aihubs.ai/submit' });
  await sleep(5000);
  // 逐字段: 定位->点击->insertText
  const fields = [
    { ph: 'Enter your link', val: 'https://aivideogeneratorfree.org/' },
    { ph: 'Enter your tool name', val: 'AI Video Generator Free' },
  ];
  for (const f of fields) {
    const r = await cdp.send('Runtime.evaluate', { expression: `(function(){
      var els=[...document.querySelectorAll('input')];
      var el=els.find(e=>!e.type||e.type==='text'||e.type==='url');
      return 'noop';
    })()`, returnByValue: true });
  }
  // 直接用 DOM 快照列出所有 input/contenteditable
  const dump = await cdp.send('Runtime.evaluate', { expression: `JSON.stringify([...document.querySelectorAll('input,textarea,[contenteditable=true]')].map(function(e,i){
    return i+':'+e.tagName+':'+(e.type||'')+':ph='+(e.placeholder||'').slice(0,25)+':v='+String(e.value||e.innerText||'').slice(0,20)+':r='+JSON.stringify(e.getBoundingClientRect());
  }))`, returnByValue: true });
  console.log(dump.result.value);
}

if (mode === 'fill2') {
  // 参数: ph 匹配的输入框直接 native set + 事件
  const pairs = [
    ['https://aivideogeneratorfree.org/', 'AI Video Generator Free',
     'Free AI video generator that turns text prompts and images into short videos right in the browser. No signup wall and no watermark, with clean MP4 exports ready for social, ads and product pages.',
     '## Turn text into video\n\nAI Video Generator Free is an online tool that converts text prompts, scripts and still images into short videos. Paste a prompt, pick a motion style and preview the result in seconds.\n\n### Highlights\n\n- Text to video and image to video modes\n- No account required for standard generation\n- Clean, watermark free MP4 output\n- Runs fully in the browser on desktop and mobile\n\nNew templates and motion styles are added every week, so there is always a fresh look to try for product demos, social clips and storytelling.'],
  ];
  const [link, name, desc, intro] = pairs[0];
  const r = await cdp.send('Runtime.evaluate', { expression: `(function(){
    var out=[];
    var els=[...document.querySelectorAll('input,textarea,[contenteditable=true]')];
    els.forEach(function(e,i){
      var ph=(e.placeholder||'')+' '+(e.getAttribute('aria-label')||'')+' '+(e.id||'')+' '+(e.name||'');
      out.push(i+':'+e.tagName+':'+ph.slice(0,30));
    });
    return JSON.stringify(out);
  })()`, returnByValue: true });
  console.log(r.result.value);
}

process.exit(0);

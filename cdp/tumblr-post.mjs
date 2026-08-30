// tumblr-post.mjs v2 — 填标题(点击H1+insertText) + 正文(合成paste text/html保锚)
import { connect, newTab, realClick, clickEl, typeInto, waitFor, log } from './lib.mjs';
import { writeFileSync, readFileSync } from 'fs';

const SHOT = 'D:/Github/backlink_skills/runs/tumblr';
const body = readFileSync('D:/Github/seoadminB/storage/tumblr-94-body.html', 'utf8');
const title = 'AI Tools Directory Hunting: How I Find Tools Before They Trend';

const { cdp, tab } = await newTab('https://www.tumblr.com/new/text', 9224);
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`, { signal: AbortSignal.timeout(3000) }).catch(()=>{});
await new Promise(r => setTimeout(r, 7000));

const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${SHOT}-${name}.jpg`, Buffer.from(data, 'base64'));
  log('shot', name);
};

// 1) 标题：点 H1 块 insertText
await clickEl(cdp, `document.querySelector('h1[contenteditable=true]')`);
await new Promise(r => setTimeout(r, 600));
await cdp.send('Input.insertText', { text: title });
await new Promise(r => setTimeout(r, 800));

// 2) 正文：点 P 块，合成 paste 事件注入 text/html
await clickEl(cdp, `document.querySelector('p[contenteditable=true]')`);
await new Promise(r => setTimeout(r, 600));
const pasteJs = `(() => {
  const html = ${JSON.stringify(body)};
  const dt = new DataTransfer();
  dt.setData('text/html', html);
  dt.setData('text/plain', html.replace(/<[^>]+>/g, ' ').slice(0, 2000));
  const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
  document.querySelector('p[contenteditable=true]').dispatchEvent(ev);
  return 'pasted';
})()`;
const pr = await cdp.eval(pasteJs);
log('paste:', pr);
await new Promise(r => setTimeout(r, 2500));
await shot('08-filled');

// 3) 验证正文块里锚是否成链
console.log(await cdp.eval(`(() => {
  const editor = document.querySelector('[data-testid=rich-text-field], .block-editor-rich-text__editable-container, form');
  const anchors = document.querySelectorAll('[contenteditable=true] a[href]');
  return JSON.stringify({anchors: anchors.length, firstHref: anchors[0]?.href?.slice(0,50), blocks: document.querySelectorAll('[contenteditable=true]').length, textLen: (document.querySelector('[class*=block-editor]')?.innerText||'').length});
})()`));

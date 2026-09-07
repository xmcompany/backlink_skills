// _w1800_solve.mjs — reCAPTCHA 通用解题器 (iframe-rel坐标制)
// 用法: node _w1800_solve.mjs <port> <urlRe> <commaTileIndices>   例: node _w1800_solve.mjs 9226 fire-directory 5,6
// 连主tab→attach bframe iframe→读tiles精确rect→主视口坐标点击→verify→轮询token/新挑战
import { connect, realClick, log } from './lib.mjs';
import fs from 'fs';

// 连 iframe target — 用sitekey区分同页多挑战 (第4参数=sitekey前缀)
const [port, urlReStr, idxStr, skPrefix] = process.argv.slice(2);
const idxs = idxStr.split(',').map(Number);
const { cdp, tab } = await connect(new RegExp(urlReStr), Number(port));
if (!tab) { console.log('TAB_NOT_FOUND'); process.exit(1); }

// 先滚回挑战区再取 rect
await cdp.eval(`(() => { const f=document.querySelector('iframe[src*=bframe]'); f && f.scrollIntoView({block:'center'}); return 1; })()`);
await new Promise(r => setTimeout(r, 800));
// bframe 主文档 rect
const bfRect = JSON.parse(await cdp.eval(`(() => { const f=document.querySelector('iframe[src*=bframe]'); if(!f) return 'null'; const r=f.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`));
if (!bfRect) { console.log('NO_BFRAME'); process.exit(1); }
log('bframe rect:', JSON.stringify(bfRect));

// 连 iframe target
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const itab = [...list].reverse().find(x => x.type === 'iframe' && /bframe/.test(x.url) && (!skPrefix || x.url.includes(skPrefix)));
if (!itab) { console.log('NO_IFRAME_TARGET'); process.exit(1); }
const ws = new WebSocket(itab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; setTimeout(() => j(new Error('ws超时')), 8000); });
const CDP = (await import('./CDP.mjs')).CDP;
const icdp = new CDP(ws);
await icdp.send('Runtime.enable').catch(() => {});

// 读 tiles (DOM顺序=row-major) — icdp.send返回已是对象, 取.result.value再parse
const tiles = JSON.parse((await icdp.send('Runtime.evaluate', { expression: `(() => {
  const ts = [...document.querySelectorAll('.rc-imageselect-tile')];
  return JSON.stringify(ts.map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), sel: t.classList.contains('rc-imageselect-tile-selected') }; }));
})()`, returnByValue: true })).result.value);
log('tiles n=' + tiles.length, JSON.stringify(tiles.slice(0, 4)));

// 点选指定格
for (const i of idxs) {
  const t = tiles[i];
  if (!t) { console.log('IDX_OOB:' + i); process.exit(1); }
  await realClick(cdp, bfRect.x + t.x, bfRect.y + t.y);
  await new Promise(r => setTimeout(r, 500));
  log('clicked tile', i);
}
await new Promise(r => setTimeout(r, 600));

// verify 按钮 (iframe内坐标映射)
const vb = JSON.parse((await icdp.send('Runtime.evaluate', { expression: `(() => {
  const b = document.querySelector('.rc-imageselect-verify-button, #recaptcha-verify-button');
  if (!b) return 'null'; const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
})()`, returnByValue: true })).result.value);
if (vb) { await realClick(cdp, bfRect.x + vb.x, bfRect.y + vb.y); log('verify clicked @', vb.x, vb.y); }
else log('NO_VERIFY_BUTTON(可能已自动提交)');

// 轮询结果: token / 新挑战 / 过期
let gotToken = false;
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const s = await cdp.eval(`(() => {
    const tok = document.querySelector('[name=g-recaptcha-response]');
    if (tok && tok.value) return JSON.stringify({ st: 'token', len: tok.value.length });
    const bf = document.querySelector('iframe[src*=bframe]');
    if (!bf) return JSON.stringify({ st: 'nocaptcha' });
    const r = bf.getBoundingClientRect();
    return r.width >= 350 ? JSON.stringify({ st: 'challenge' }) : JSON.stringify({ st: 'small' });
  })()`).catch(() => null);
  if (!s) continue;
  const j = JSON.parse(s);
  if (j.st === 'token') {
    console.log('RESULT:TOKEN len=' + j.len);
    // ★token到手立即clickEl真实点提交按钮(phpLD requestSubmit服务端收不到码)
    const { clickEl, waitFor } = await import('./lib.mjs');
    const btn = await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`).catch(e => null);
    console.log('SUBMIT_CLICK:', JSON.stringify(btn));
    for (let k = 0; k < 10; k++) {
      await new Promise(r => setTimeout(r, 2500));
      const rc = await cdp.eval(`(() => { const t=document.body.innerText;
        const m = t.match(/CAPTCHA was completed[^\n]*|link submitted[^\n]*|awaiting approval[^\n]*|already exists[^\n]*|not unique[^\n]*|thank you[^\n]*|go back[^\n]*|error[^\n]{0,50}/gi);
        return m ? m.join(' | ').slice(0,250) : null; })()`).catch(() => null);
      if (rc) { console.log('RECEIPT:', rc); break; }
    }
    const fs2 = await import('fs');
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs2.writeFileSync('D:/Github/backlink_skills/runs/_w1800_solve_after.jpg', Buffer.from(shot.data, 'base64'));
    process.exit(0);
  }
  if (j.st === 'challenge' && i > 2) {
    // 新一轮挑战: 截图+dump tiles供下轮判定
    await cdp.eval(`document.querySelector('iframe[src*=bframe]').scrollIntoView({block:'center'})`);
    await new Promise(r => setTimeout(r, 900));
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_round2.jpg', Buffer.from(shot.data, 'base64'));
    const t2 = await icdp.send('Runtime.evaluate', { expression: `(() => JSON.stringify([...document.querySelectorAll('.rc-imageselect-tile')].length))()`, returnByValue: true });
    console.log('RESULT:ROUND2 tiles=' + t2.result.value);
    process.exit(2);
  }
}
console.log('RESULT:TIMEOUT_OR_SILENT');

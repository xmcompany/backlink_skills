// _w1800_rech.mjs — 只重开reCAPTCHA挑战: 点anchor复选框→截图(不碰表单)
// 用法: node _w1800_rech.mjs <port> <urlRe> <shotPath>
import { connect, realClick, log } from './lib.mjs';
import fs from 'fs';

const [port, urlReStr, shotPath] = process.argv.slice(2);
const { cdp, tab } = await connect(new RegExp(urlReStr), Number(port));
if (!tab) { console.log('TAB_NOT_FOUND'); process.exit(1); }

await cdp.eval(`(() => { const f = document.querySelector('iframe[src*=anchor]'); f && f.scrollIntoView({ block: 'center' }); return 1; })()`);
await new Promise(r => setTimeout(r, 700));
const a = JSON.parse(await cdp.eval(`(() => { const f = document.querySelector('iframe[src*=anchor]'); if (!f) return 'null'; const r = f.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + 30), y: Math.round(r.y + 39) }); })()`));
if (a === 'null') { console.log('NO_ANCHOR'); process.exit(1); }
await realClick(cdp, a.x, a.y);
log('checkbox clicked');
for (let i = 0; i < 14; i++) {
  await new Promise(r => setTimeout(r, 1500));
  const s = await cdp.eval(`(() => {
    const tok = document.querySelector('[name=g-recaptcha-response]');
    if (tok && tok.value) return JSON.stringify({ st: 'token' });
    const bf = document.querySelector('iframe[src*=bframe]');
    if (!bf) return null;
    const r = bf.getBoundingClientRect();
    return (r.width >= 350 && r.y > -100 && r.y < 2000) ? JSON.stringify({ st: 'challenge', y: Math.round(r.y) }) : null;
  })()`).catch(() => null);
  if (!s) continue;
  const j = JSON.parse(s);
  if (j.st === 'token') { console.log('RESULT:TOKEN'); process.exit(0); }
  if (j.st === 'challenge') {
    await new Promise(r => setTimeout(r, 1200)); // 等图渲染全
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('RESULT:CHALLENGE shot=' + shotPath);
    process.exit(2);
  }
}
console.log('RESULT:SILENT');

// _r0200_bgl2.mjs — recaptcha checkbox 点击尝试
import { CDP, sleep } from './CDP.mjs';
const tabs = await fetch('http://127.0.0.1:9224/json/list').then(r => r.json());
const tab = tabs.find(t => t.type === 'page' && t.url.includes('bloggalot.com'));
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
await sleep(5000);
let tok = await c.eval(`document.querySelector('#g-recaptcha-response')?.value?.length || 0`);
console.log('token after wait:', tok);
if (!tok) {
  // 找 recaptcha iframe 的 checkbox 位置并真实点击
  const rect = await c.eval(`(() => {
    const f = document.querySelector('iframe[src*="recaptcha"][src*="anchor"], iframe[title*="reCAPTCHA"]');
    if (!f) return 'no-iframe';
    const r = f.getBoundingClientRect();
    return JSON.stringify({x: Math.round(r.x + 28), y: Math.round(r.y + r.height/2)});
  })()`);
  console.log('rect:', rect);
  if (rect.startsWith('{')) {
    const {x, y} = JSON.parse(rect);
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    console.log('clicked checkbox at', x, y);
    await sleep(6000);
    tok = await c.eval(`document.querySelector('#g-recaptcha-response')?.value?.length || 0`);
    console.log('token after click:', tok);
  }
}
if (tok) {
  const sub = await c.eval(`(() => {
    const f = document.querySelector('form[action*="register"]');
    if (!f) return 'no-form';
    const b = [...f.querySelectorAll('button')].find(b=>/register|sign ?up/i.test(b.innerText||''));
    if (b) { b.click(); return 'btn-clicked:'+b.innerText.slice(0,20); }
    f.submit(); return 'form-submit';
  })()`);
  console.log('submit:', sub);
  await sleep(8000);
  const fin = await c.eval(`JSON.stringify({url: location.href.slice(0,90), body: (document.body.innerText||'').slice(0,200)})`);
  console.log('fin:', fin);
} else {
  console.log('NO-TOKEN — recaptcha 未过');
}
c.close?.();
process.exit(0);

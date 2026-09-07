// _w1800_fd_recon.mjs — fire-directory.com 侦查: 开tab+dump表单结构
import { newTab, log, closeTab } from './lib.mjs';

const { cdp, tab } = await newTab('https://fire-directory.com/submit.php', 9226);
await new Promise(r => setTimeout(r, 25000)); // 等页(代理慢)

const info = await cdp.send('Runtime.evaluate', { expression: `(() => {
  const f = document.querySelector('form');
  if (!f) return JSON.stringify({ err: 'no form', body: document.body.innerText.slice(0, 300) });
  const fields = [...f.querySelectorAll('input,select,textarea,button')].map(e => ({
    tag: e.tagName, type: e.type, name: e.name, id: e.id, val: (e.value || '').slice(0, 30),
    req: e.required, opts: e.tagName === 'SELECT' ? [...e.options].slice(0, 5).map(o => o.value + ':' + o.text.slice(0, 20)).join('|') : undefined
  }));
  const recaptcha = !!document.querySelector('.g-recaptcha, [data-sitekey], iframe[src*="recaptcha"]');
  return JSON.stringify({ action: f.action, method: f.method, n: fields.length, fields, recaptcha });
})()`, returnByValue: true });
console.log('URL:', tab.url);
console.log(info.result.value);
await closeTab(cdp, tab, 9226);

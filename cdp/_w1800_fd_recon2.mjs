// _w1800_fd_recon2.mjs — fire-directory.com 深侦查: 全部form+recaptcha位置+类目链接
import { newTab, log, closeTab } from './lib.mjs';

const { cdp, tab } = await newTab('https://fire-directory.com/submit.php', 9226);
await new Promise(r => setTimeout(r, 25000)); // 代理慢

const info = await cdp.send('Runtime.evaluate', { expression: `(() => {
  const forms = [...document.querySelectorAll('form')].map(f => ({
    action: f.action, method: f.method,
    fields: [...f.querySelectorAll('input,select,textarea')].map(e => e.tagName + ':' + (e.name || e.id) + '=' + (e.value || '').slice(0, 20)).join(',')
  }));
  const rc = [...document.querySelectorAll('.g-recaptcha,[data-sitekey]')].map(e => e.dataset.sitekey || e.getAttribute('data-sitekey'));
  const cats = [...document.querySelectorAll('a[href*="c="]')].slice(0, 8).map(a => a.href + ' «' + a.textContent.trim().slice(0, 25) + '»');
  const iframes = [...document.querySelectorAll('iframe')].map(f => f.src.slice(0, 60));
  return JSON.stringify({ forms, rc, cats, iframes, bodyLen: document.body.innerText.length }, null, 1);
})()`, returnByValue: true });
console.log(info.result.value);
await closeTab(cdp, tab, 9226);

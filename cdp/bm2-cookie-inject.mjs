// bm2: 注入 bm-cookie-manual.json 的 cookie 到 9226, 验证登录, 找额度页
import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'node:fs';

const jman = JSON.parse(readFileSync('D:/Github/backlink_skills/cdp/bm-cookie-manual.json', 'utf8'));
const ck = jman.cookie;
const tabs = await (await fetch('http://127.0.0.1:9226/json/list')).json();
let page = tabs.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
if (!page) {
  page = await (await fetch('http://127.0.0.1:9226/json/new?' + encodeURIComponent('https://bigmodel.cn/'), { method: 'PUT' })).json();
  await sleep(5000);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
try {
  // 注入 cookie (复刻 bm-cookie-inject.mjs 职责)
  const sameSiteMap = { no_restriction: 'None', lax: 'Lax', strict: 'Strict', unspecified: 'NoSameSite' };
  const setResult = await cdp.send('Network.setCookie', {
    name: ck.name, value: ck.value, domain: ck.domain || '.bigmodel.cn', path: ck.path || '/',
    secure: !!ck.secure, httpOnly: !!ck.httpOnly,
    sameSite: sameSiteMap[ck.sameSite] || 'None',
    expires: ck.expires || undefined,
  });
  console.log('SET-COOKIE:', JSON.stringify(setResult), 'name=', ck.name, 'expires=', ck.expires ? new Date(ck.expires * 1000).toISOString() : 'session');

  await cdp.goto('https://bigmodel.cn/', 30000);
  await sleep(6000);
  const st = await cdp.eval(`(() => {
    const t = document.body.innerText;
    return JSON.stringify({ login: /登录\\s*\\/\\s*注册/.test(t), head: t.slice(0, 150) });
  })()`);
  console.log('HOME:', st);
  if (st.includes('"login":true')) { console.log('!! 仍未登录'); }

  // 找控制台/用量入口
  const links = await cdp.eval(`JSON.stringify([...document.querySelectorAll('a')].map(a=>a.innerText.trim()+'|'+a.href).filter(x=>/控制台|用量|资源|费用|个人中心|订阅/.test(x)).slice(0,10))`);
  console.log('LINKS:', links);
} catch (e) {
  console.error('ERR', e.message);
} finally { ws.close(); }

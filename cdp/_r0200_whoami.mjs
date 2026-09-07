// _r0200_whoami.mjs — cookie注入后登录态快速验证: node _r0200_whoami.mjs <domain> <登录特征选择器或文本正则>
import { CDP, sleep } from './CDP.mjs';
const [domain, pattern] = process.argv.slice(2);
const tab = await fetch('http://127.0.0.1:9224/json/new?https://' + domain, { method: 'PUT' }).then(r => r.json());
await CDP.attachById(tab.id, 9224).then(async c => { try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {} try { c.close(); } catch {} }).catch(() => {});
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
await sleep(8000);
const out = await c.eval(`JSON.stringify({
  url: location.href.slice(0,80),
  loggedIn: ${JSON.stringify(pattern)} ? new RegExp(${JSON.stringify(pattern)},'i').test(document.body.innerText||'') : null,
  hint: (document.body.innerText||'').slice(0,150)
})`).catch(e => JSON.stringify({err: e.message}));
console.log(out);
c.close?.();
await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(()=>{});
process.exit(0);

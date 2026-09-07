// _r0200_probe.mjs — 9224 快速侦察 /register 页面特征
// 用法: node _r0200_probe.mjs <domain>  (输出 form字段特征, 判定真壳/异构/死)
import { CDP, sleep } from './CDP.mjs';
const [domain] = process.argv.slice(2);
const tab = await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/register', { method: 'PUT' }).then(r => r.json());
await CDP.attachById(tab.id, 9224).then(async c => { try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {} try { c.close(); } catch {} }).catch(() => {});
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
await sleep(9000);
const out = await c.eval(`JSON.stringify({
  url: location.href.slice(0,80),
  title: document.title.slice(0,60),
  hasRegisterForm: !!document.querySelector('form input[name=username], form input[name=email]'),
  fields: [...document.querySelectorAll('form input')].map(i=>i.name||i.type).slice(0,10),
  textLen: (document.body.innerText||'').length,
  cfBlocked: /attention required|just a moment/i.test(document.title + (document.body.innerText||'').slice(0,500))
})`).catch(e => JSON.stringify({err: e.message}));
console.log(domain, '=>', out);
c.close?.();
await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(()=>{});
process.exit(0);

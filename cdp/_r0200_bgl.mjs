// _r0200_bgl.mjs — bloggalot 异构(Laravel)注册: 9224填user_*三字段+等recaptcha渲染+form提交
import { CDP, sleep } from './CDP.mjs';
const tabs = await fetch('http://127.0.0.1:9224/json/list').then(r => r.json());
let tab = tabs.find(t => t.type === 'page' && t.url.includes('bloggalot.com'));
if (!tab) {
  tab = await fetch('http://127.0.0.1:9224/json/new?https://bloggalot.com/register', { method: 'PUT' }).then(r => r.json());
  await CDP.attachById(tab.id, 9224).then(async c => { try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {} try { c.close(); } catch {} }).catch(() => {});
}
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {}
await sleep(4000);
await c.eval(`if (!/register/.test(location.href)) location.href='https://bloggalot.com/register'; 'nav'`);
await sleep(6000);
const fill = await c.eval(`(() => {
  const set=(n,v)=>{const el=document.querySelector('input[name='+n+']'); if(!el) return n+':missing'; el.focus(); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); return n+':ok';};
  return JSON.stringify([set('user_username','leoxmb'), set('user_email','bloggalot@387654.com'), set('user_password','Xx@Bgl26!Xm'),
    document.querySelector('.g-recaptcha')? 'recaptcha-rendered':'recaptcha-absent',
    document.querySelector('#g-recaptcha-response')?.value?.length ? 'token-present':'token-empty',
    [...document.querySelectorAll('.g-recaptcha')].map(g=>g.dataset.sitekey||'nokey').join(',')
  ]);
})()`);
console.log('fill:', fill);
process.exit(0);

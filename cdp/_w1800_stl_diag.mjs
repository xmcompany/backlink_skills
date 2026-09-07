import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('stellarlaunch'));
const c = await CDP.attachById(tab.id, 9224);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`);
await sleep(500);
// 哪个tab活跃
console.log('TABS:', await c.eval(`[...document.querySelectorAll('[role=tab],[aria-selected]')].map(e=>(e.innerText||e.getAttribute('aria-selected')).trim().slice(0,20)+':'+e.getAttribute('aria-selected')).join('|')`));
// 全字段+checked
console.log('ALLFIELDS:', await c.eval(`(() => {
  const out=[];
  for (const e of document.querySelectorAll('input,textarea,select')) {
    out.push(e.tagName.slice(0,1)+':'+e.type+':'+(e.name||'')+':'+(e.checked!==undefined?(e.checked?'CHECKED':'un'):'')+':'+String(e.value||'').slice(0,15));
  }
  return JSON.stringify(out);
})()`));
// 报错文本
const body = await c.eval(`document.body.innerText.replace(/\s+/g,' ')`);
const ei = body.search(/required|select at least|please|must/i);
console.log('ERR:', ei>=0 ? body.slice(Math.max(0,ei-40), ei+120) : 'none');
// Next 与 上一步按钮 + 表单区尾部文本
console.log('BTNS:', await c.eval(`[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null).map(b=>b.innerText.trim().slice(0,15)+(b.disabled?'[DIS]':'')).join('|')`));
console.log('TAIL:', body.slice(-600));

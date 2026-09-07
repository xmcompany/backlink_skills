// _r0200_edit.mjs — edit-post 页替换标题+内容后 requestSubmit(复用frpub配方)
// 用法: node _r0200_edit.mjs <domain> <postId> <title> <htmlfile>
import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const [domain, postId, title, htmlFile] = process.argv.slice(2);
const html = readFileSync(htmlFile, 'utf8').trim();
const tabs = await fetch('http://127.0.0.1:9224/json/list').then(r => r.json());
let tab = tabs.find(t => t.type === 'page' && t.url.includes(domain) && t.url.includes('edit-post'));
if (!tab) {
  tab = await fetch(`http://127.0.0.1:9224/json/new?https://${domain}/edit-post?${postId}`, { method: 'PUT' }).then(r => r.json());
  await CDP.attachById(tab.id, 9224).then(async c => { try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {} try { c.close(); } catch {} }).catch(() => {});
}
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
try { await c.send('Target.activateTarget', { targetId: tab.id }); } catch {}
await sleep(5000);
const pre = await c.eval(`(() => {
  const f = document.querySelector('form#post');
  if (!f) return JSON.stringify({err:'no-form', url: location.href});
  const t = document.querySelector('#title');
  t.focus(); document.execCommand('selectAll',false,null); document.execCommand('insertText', false, ${JSON.stringify(title)});
  const ta = document.querySelector('#content');
  ta.value = ${JSON.stringify(html)};
  if (window.tinymce && tinymce.get('content')) { try { tinymce.get('content').setContent(${JSON.stringify(html)}); } catch(e) {} }
  return JSON.stringify({url: location.href, title: t.value, taLen: ta.value.length});
})()`);
console.log('pre:', pre);
try { await c.eval(`document.querySelector('form#post').requestSubmit(document.querySelector('#publish'))`); } catch (e) { console.log('submit err:', e.message); }
await sleep(8000);
const post = await c.eval(`JSON.stringify({url: location.href, msg: (document.querySelector('#message')?.innerText||'').slice(0,120)})`).catch(e => 'nav');
console.log('post:', post);
c.close?.();
process.exit(0);

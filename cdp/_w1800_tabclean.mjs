import { sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const pages = list.filter(t => t.type === 'page');
for (const t of pages) {
  if (t.url.includes('obiwandispensary')) {
    await fetch(`http://127.0.0.1:9224/json/close/${t.id}`);
    console.log('closed', t.url.slice(0, 40));
  }
}
setTimeout(() => process.exit(0), 500);

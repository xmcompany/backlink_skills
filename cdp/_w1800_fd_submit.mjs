// _w1800_fd_submit.mjs — fire-directory 提交+回执确认
import { connect, clickEl, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/fire-directory\.com/, 9226);
if (!tab) { console.log('TAB_NOT_FOUND'); process.exit(1); }
const tok = await cdp.eval(`(document.querySelector('[name=g-recaptcha-response]')||{}).value?.length||0`);
log('token len:', tok);
if (!tok) { console.log('NO_TOKEN'); process.exit(1); }

await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`);
log('submit clicked');
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const s = await cdp.eval(`(() => {
    const t = document.body.innerText;
    if (/submitted|already exists|awaiting approval|error|thank/i.test(t)) return JSON.stringify({ done: true, txt: t.slice(0, 500) });
    return null;
  })()`).catch(() => null);
  if (s) { console.log('RECEIPT:', JSON.parse(s).txt.replace(/\n+/g, ' | ').slice(0, 400)); break; }
}
console.log('URLNOW:', tab.url);
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_fd_after.jpg', Buffer.from(shot.data, 'base64'));

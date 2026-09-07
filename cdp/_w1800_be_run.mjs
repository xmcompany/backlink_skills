// _w1800_be_run.mjs — bedirectory 一体化: 导航(防广告劫持)→填表→capture→token则提交
import { connect, typeInto, challengeCapture, clickEl, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/bedirectory\.com|justlink\.org/, 9226);
const target = /bedirectory\.com/.test(tab.url) ? tab.url : 'https://www.bedirectory.com/submit.php?c=51&LINK_TYPE=1';
if (!/bedirectory\.com/.test(tab.url)) {
  log('tab被劫持到', tab.url.slice(0, 50), '导航回提交页');
  await cdp.send('Page.navigate', { url: target }).catch(() => {});
}
await cdp.send('Page.navigate', { url: 'https://www.bedirectory.com/submit.php?c=51&LINK_TYPE=1' }).catch(() => {});
await new Promise(r => setTimeout(r, 22000));

const has = await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); return f?'ok':'nf'; })()`);
if (has !== 'ok') { console.log('FORM_NOT_FOUND ' + tab.url); process.exit(1); }

const cat = await cdp.eval(`(() => {
  const s = [...document.querySelectorAll('select')].find(s => s.name === 'CATEGORY_ID');
  const opt = s && ([...s.options].find(o => o.value === '51') || [...s.options].find(o => /computer/i.test(o.text)));
  if (!opt) return 'nf';
  s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  return opt.value + ':' + opt.text.trim().slice(0, 25);
})()`);
console.log('CAT:', cat);

console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Tools Directory – Best Free AI Tools List'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aitoolsdirectory.vip'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Browse a curated directory of the best AI tools for writing, image generation, video creation and productivity. Free listings, daily updates, no sign-up needed to explore.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'bedir.genhouse@387654.com'));

const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_be_ch.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));
if (ch.kind !== 'token') process.exit(2); // challenge: 等解题脚本

log('token在手, 提交');
await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`);
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 2500));
  const s = await cdp.eval(`(() => { const t=document.body.innerText;
    if (/link submitted|awaiting approval|already exists|thank|error|invalid|required/i.test(t)) return t.slice(0,400); return null; })()`).catch(() => null);
  if (s) { console.log('RECEIPT:', s.replace(/\n+/g, ' | ').slice(0, 350)); break; }
}
console.log('URLNOW:', tab.url);
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_be_after.jpg', Buffer.from(shot.data, 'base64'));

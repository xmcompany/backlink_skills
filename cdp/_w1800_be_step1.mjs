// _w1800_be_step1.mjs — bedirectory 填表+capture (t5=aitoolsdirectory.vip)
// halfway教训: 勿strip onclick / OB1广告iframe勿点 / 真实鼠标点码
import { connect, typeInto, challengeCapture, clickEl, waitFor, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/bedirectory\.com/, 9226);
if (!tab) { console.log('TAB_NOT_FOUND'); process.exit(1); }
log('刷新提交页');
await cdp.send('Page.navigate', { url: 'https://www.bedirectory.com/submit.php?c=51&LINK_TYPE=1' });
await new Promise(r => setTimeout(r, 22000));

const has = await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); return f?'ok':'nf'; })()`);
if (has !== 'ok') { console.log('FORM_NOT_FOUND', await cdp.eval('document.title')); process.exit(1); }

const cat = await cdp.eval(`(() => {
  const s = [...document.querySelectorAll('select')].find(s => s.name === 'CATEGORY_ID');
  if (!s) return 'nf';
  const opt = [...s.options].find(o => o.value === '51') || [...s.options].find(o => /computer/i.test(o.text));
  if (!opt) return 'no51';
  s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  return opt.value + ':' + opt.text.trim().slice(0, 30);
})()`);
console.log('CAT:', cat);

console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Tools Directory – Best Free AI Tools List'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aitoolsdirectory.vip'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Browse a curated directory of the best AI tools for writing, image generation, video creation and productivity. Free listings, daily updates, no sign-up needed to explore.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'bedir.genhouse@387654.com'));

const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_be_ch.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));
if (ch.kind === 'token') {
  log('已持token, 点提交(勿strip onclick)');
  await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`);
  await new Promise(r => setTimeout(r, 15000));
  const done = await cdp.eval(`document.body.innerText.slice(0, 700)`);
  console.log('AFTER:', done.replace(/\n+/g, ' | ').slice(0, 500));
  console.log('URLNOW:', tab.url);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_be_after.jpg', Buffer.from(shot.data, 'base64'));
}

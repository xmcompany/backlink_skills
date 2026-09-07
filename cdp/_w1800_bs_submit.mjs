// _w1800_bs_submit.mjs — bluesparkle 填表+提交 (t1=aivideogeneratorfree.org 首投)
import { connect, typeInto, clickEl, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/bluesparkledirectory/, 9224);
const tok = await cdp.eval(`(document.querySelector('[name=g-recaptcha-response]')||{value:''}).value.length`);
log('token len:', tok);

console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Video Generator Free – Create Videos from Text Online'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aivideogeneratorfree.org'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Generate AI videos from text prompts for free. Turn any idea into a shareable video clip with this online AI video generator – no design skills or software install required.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'bluesparkle.genhouse@387654.com'));
// CATEGORY_ID 已选51? 查一下
console.log('CAT:', await cdp.eval(`(() => { const s=[...document.querySelectorAll('select')].find(s=>s.name==='CATEGORY_ID'); return s ? s.value+':'+s.selectedOptions[0].text.trim().slice(0,25) : 'nf'; })()`));

await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit],button[type=submit],#submitForm-btn')`).catch(e => log('click err', e.message));
await new Promise(r => setTimeout(r, 2000));
// 兜底: 若按钮没找到直接 requestSubmit
const st = await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); if(!f) return 'nf'; const tok=(document.querySelector('[name=g-recaptcha-response]')||{value:''}).value.length; return JSON.stringify({tokLen: tok}); })()`);
console.log('PRE-SUBMIT:', st);
await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); f && f.requestSubmit && f.requestSubmit(); return 'submitted'; })()`);
log('submitted');
for (let i = 0; i < 14; i++) {
  await new Promise(r => setTimeout(r, 2500));
  const s = await cdp.eval(`(() => { const t=document.body.innerText;
    if (/link submitted|awaiting approval|already exists|thank|error|invalid|required|captcha/i.test(t)) return t.slice(0,450); return null; })()`).catch(() => null);
  if (s) { console.log('RECEIPT:', s.replace(/\n+/g, ' | ').slice(0, 400)); break; }
}
console.log('URLNOW:', tab.url);
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_bs_after.jpg', Buffer.from(shot.data, 'base64'));

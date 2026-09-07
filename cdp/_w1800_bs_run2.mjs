// _w1800_bs_run2.mjs — bluesparkle 重走: 填表→capture→(token后)立即提交
import { connect, typeInto, challengeCapture, clickEl, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/bluesparkledirectory/, 9224);
// 刷新拿干净表单
await cdp.send('Page.navigate', { url: 'https://www.bluesparkledirectory.com/submit.php?c=51&LINK_TYPE=1' }).catch(() => {});
await new Promise(r => setTimeout(r, 18000));

console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Video Generator Free – Create Videos from Text Online'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aivideogeneratorfree.org'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Generate AI videos from text prompts for free. Turn any idea into a shareable video clip with this online AI video generator – no design skills or software install required.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'bluesparkle.genhouse@387654.com'));

const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_bs_ch2.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));
if (ch.kind !== 'token') { console.log('NEED_SOLVE'); process.exit(2); }
log('token在手, 立即提交');
await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); f && f.requestSubmit(); return 1; })()`);
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 2500));
  const s = await cdp.eval(`(() => { const t=document.body.innerText;
    const m = t.match(/CAPTCHA was completed[^\n]*|link submitted[^\n]*|awaiting approval[^\n]*|already exists[^\n]*|thank you[^\n]*|go back[^\n]*|error[^\n]{0,60}/gi);
    return m ? m.join(' | ').slice(0,300) : null; })()`).catch(() => null);
  if (s) { console.log('RECEIPT:', s); break; }
}
console.log('URLNOW:', tab.url);
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_bs_after2.jpg', Buffer.from(shot.data, 'base64'));

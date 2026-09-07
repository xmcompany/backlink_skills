// _w1800_bs_run3.mjs — bluesparkle 填表→capture→(token后)clickEl真实点Continue
import { connect, typeInto, challengeCapture, clickEl, log } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await connect(/bluesparkledirectory/, 9224);
console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Video Generator Free – Create Videos from Text Online'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aivideogeneratorfree.org'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Generate AI videos from text prompts for free. Turn any idea into a shareable video clip with this online AI video generator – no design skills or software install required.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'bluesparkle.genhouse@387654.com'));

const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_bs_ch4.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));
if (ch.kind !== 'token') { console.log('NEED_SOLVE'); process.exit(2); }
log('token在手, clickEl 真实点 Continue');
const r = await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`);
console.log('CLICK:', JSON.stringify(r));
for (let i = 0; i < 12; i++) {
  await new Promise(r2 => setTimeout(r2, 2500));
  const s = await cdp.eval(`(() => { const t=document.body.innerText;
    const m = t.match(/CAPTCHA was completed[^\n]*|link submitted[^\n]*|awaiting approval[^\n]*|already exists[^\n]*|thank you[^\n]*|go back[^\n]*|error[^\n]{0,60}/gi);
    return m ? m.join(' | ').slice(0,300) : null; })()`).catch(() => null);
  if (s) { console.log('RECEIPT:', s); break; }
}
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_bs_after4.jpg', Buffer.from(shot.data, 'base64'));
console.log('URLNOW:', tab.url);

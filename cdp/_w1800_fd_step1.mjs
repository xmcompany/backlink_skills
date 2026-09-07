// _w1800_fd_step1.mjs — fire-directory 填表+reCAPTCHA capture (t1=aivideogeneratorfree.org)
import { newTab, typeInto, challengeCapture, clickEl, waitFor, log, closeTab } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await newTab('https://fire-directory.com/submit.php', 9226);
await new Promise(r => setTimeout(r, 25000)); // 代理慢等渲染

// 表单在第二个form(第一个是搜索)
const has = await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); return f?'ok':'nf'; })()`);
if (has !== 'ok') { console.log('FORM_NOT_FOUND'); process.exit(1); }

// CATEGORY_ID 选 Computers 类目
const cat = await cdp.eval(`(() => {
  const s = [...document.querySelectorAll('select')].find(s => s.name === 'CATEGORY_ID');
  if (!s) return 'nf';
  const opt = [...s.options].find(o => /computer/i.test(o.text));
  if (!opt) return JSON.stringify({ opts: [...s.options].slice(0, 40).map(o => o.value + ':' + o.text.trim().slice(0, 20)).join(' | ') });
  s.value = opt.value;
  s.dispatchEvent(new Event('change', { bubbles: true }));
  return JSON.stringify({ picked: opt.value + ':' + opt.text.trim().slice(0, 30) });
})()`);
console.log('CAT:', cat);

console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', 'AI Video Generator Free – Create Videos from Text Online'));
console.log('URL:', await typeInto(cdp, '[name=URL]', 'https://aivideogeneratorfree.org'));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', 'Generate AI videos from text prompts for free. Turn any idea into a shareable video clip with this online AI video generator – no design skills or software install required.'));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', 'firedir.genhouse@387654.com'));

// reCAPTCHA
const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_fd_ch.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));
if (ch.kind === 'token') {
  log('已持token, 点提交');
  await clickEl(cdp, `[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')).querySelector('input[name=submit]')`);
  await waitFor(cdp, `document.body.innerText.includes('submitted') || document.body.innerText.toLowerCase().includes('already exists') || document.body.innerText.includes('error')`, 30000);
  const done = await cdp.eval(`document.body.innerText.slice(0, 600)`);
  console.log('AFTER:', done.replace(/\n+/g, ' | ').slice(0, 400));
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_fd_after.jpg', Buffer.from(shot.data, 'base64'));
}
// challenge: 不关tab, 等解题脚本接管

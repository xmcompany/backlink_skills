// _w1800_dir_run.mjs — phpLD reCAPTCHA族通用: 开tab填表+capture
// 用法: node _w1800_dir_run.mjs <domain> <catId> <emailPrefix> <title> <url> <desc>
import { newTab, typeInto, challengeCapture, log } from './lib.mjs';

const [domain, catId, emailPrefix, title, url, desc] = process.argv.slice(2);
const full = url.replace(/\/$/, '');
const { cdp, tab } = await newTab(`https://www.${domain}/submit.php?c=${catId}&LINK_TYPE=1`, 9224);
await new Promise(r => setTimeout(r, 15000));
const has = await cdp.eval(`(() => { const f=[...document.querySelectorAll('form')].find(f=>f.querySelector('[name=TITLE]')); return f?'ok':'nf'; })()`);
if (has !== 'ok') { console.log('FORM_NOT_FOUND ' + tab.url); process.exit(1); }
const cat = await cdp.eval(`(() => { const s=[...document.querySelectorAll('select')].find(s=>s.name==='CATEGORY_ID'); if(s){s.value='${catId}'; s.dispatchEvent(new Event('change',{bubbles:true}));} return s?s.value:'nf'; })()`);
console.log('CAT:', cat);
console.log('TITLE:', await typeInto(cdp, '[name=TITLE]', title));
console.log('URL:', await typeInto(cdp, '[name=URL]', full));
console.log('DESC:', await typeInto(cdp, '[name=DESCRIPTION]', desc));
console.log('OWNER:', await typeInto(cdp, '[name=OWNER_NAME]', 'leoxm26'));
console.log('EMAIL:', await typeInto(cdp, '[name=OWNER_EMAIL]', `${emailPrefix}.genhouse@387654.com`));
const ch = await challengeCapture(cdp, 'D:/Github/backlink_skills/runs/_w1800_cur_ch.jpg');
console.log('CAPTCHA:', JSON.stringify(ch));

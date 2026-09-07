// _w1800_wdp_login.mjs — webdirectoryphil 9224登录→提交页侦查
import fs from "fs";
import { newTab, typeInto, clickEl, waitFor, log, closeTab } from './lib.mjs';

const { cdp, tab } = await newTab('https://webdirectoryphil.com/wp-login.php', 9224);
await waitFor(cdp, `!!document.querySelector('#user_login')`, 30000);
console.log('LOGIN:', await typeInto(cdp, '#user_login', 'leoxm26'));
console.log('PASS:', await typeInto(cdp, '#user_pass', 'Xx@Wdp26!Xm'));
await clickEl(cdp, `document.querySelector('#wp-submit')`);
await new Promise(r => setTimeout(r, 8000));
console.log('URLNOW:', tab.url);
const body = await cdp.eval(`document.body.innerText.slice(0, 300)`);
console.log('TXT:', body.replace(/\n+/g, ' | ').slice(0, 250));
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_wdp_login.jpg', Buffer.from(shot.data, 'base64'));

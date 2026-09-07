// _w1800_bs_test.mjs — bluesparkle(6LewSVYU) 挑战下发测试: 新tab开页→点码→报告
import { newTab, realClick, log, closeTab } from './lib.mjs';
import fs from 'fs';

const { cdp, tab } = await newTab('https://www.bluesparkledirectory.com/submit.php?c=51&LINK_TYPE=1', 9224);
await new Promise(r => setTimeout(r, 20000));
const a = JSON.parse(await cdp.eval(`(() => { const f=document.querySelector('iframe[src*=anchor]'); if(!f) return 'null'; f.scrollIntoView({block:'center'}); const r=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+30),y:Math.round(r.y+39)}); })()`));
if (a === 'null') { console.log('NO_ANCHOR'); process.exit(1); }
await new Promise(r => setTimeout(r, 500));
await realClick(cdp, a.x, a.y);
log('clicked', a.x, a.y);
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 1500));
  const s = await cdp.eval(`(() => {
    const tok=document.querySelector('[name=g-recaptcha-response]');
    if (tok && tok.value) return JSON.stringify({st:'token'});
    const bf=document.querySelector('iframe[src*=bframe]');
    const r=bf&&bf.getBoundingClientRect();
    return r && r.width>250 && r.y>-50 ? JSON.stringify({st:'challenge',w:Math.round(r.width)}) : null;
  })()`).catch(()=>null);
  if (s) { console.log('RESULT:', s); 
    if (JSON.parse(s).st === 'challenge') {
      await new Promise(r => setTimeout(r, 1200));
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
      fs.writeFileSync('D:/Github/backlink_skills/runs/_w1800_bs_ch.jpg', Buffer.from(shot.data, 'base64'));
      console.log('SHOT saved');
    }
    process.exit(0);
  }
}
console.log('RESULT:SILENT');

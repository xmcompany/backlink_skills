// _r0200_bgl3.mjs — bloggalot recaptcha 快速链: 点checkbox→(外部判图)→点格→验证→提交
// 用法: node _r0200_bgl3.mjs click           # 步骤A: 点checkbox开挑战+立即截图
//       node _r0200_bgl3.mjs pick 2,4,7     # 步骤B: 点格+验证+查token+提交
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const [mode, picks] = process.argv.slice(2);
const tabs = await fetch('http://127.0.0.1:9224/json/list').then(r=>r.json());
const tab = tabs.find(t=>t.type==='page'&&t.url.includes('bloggalot.com'));
const c = await CDP.attachById(tab.id);
await c.send('Page.enable');
try{ await c.send('Target.activateTarget',{targetId:tab.id}); }catch{}
await sleep(1000);
const click = (x,y) => { c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
if (mode === 'click') {
  click(348, 546);            // checkbox（页面坐标已实证）
  await sleep(6000);
  const st = await c.eval(`JSON.stringify({challenge: !!document.querySelector('iframe[src*="bframe"], iframe[title*="挑战"], iframe[title*="challenge"]'), token: document.querySelector('#g-recaptcha-response')?.value?.length||0})`);
  console.log('after click:', st);
  const shot = await c.send('Page.captureScreenshot',{format:'png'});
  writeFileSync('D:/Github/seoadminB/storage/_r0200_bgl_chal.png', Buffer.from(shot.data,'base64'));
  console.log('chal shot saved');
} else if (mode === 'pick') {
  const cells = {1:[648,608],2:[850,608],3:[1052,608],4:[648,830],5:[850,830],6:[1052,830],7:[648,1018],8:[850,1018],9:[1052,1018]};
  for (const n of (picks||'').split(',').map(Number).filter(Boolean)) { const [x,y]=cells[n]; click(x,y); await sleep(700); }
  console.log('cells clicked:', picks);
  await sleep(800);
  click(1046, 1153);          // 验证按钮
  await sleep(7000);
  const st = await c.eval(`JSON.stringify({token: document.querySelector('#g-recaptcha-response')?.value?.length||0, note: (document.body.innerText||'').slice(0,150)})`);
  console.log('after verify:', st);
  const tok = JSON.parse(st).token;
  if (tok) {
    const sub = await c.eval(`(() => { const b=[...document.querySelectorAll('button')].find(b=>/^register$/i.test((b.innerText||'').trim())); if(!b) return 'no-btn'; b.click(); return 'register-clicked'; })()`);
    console.log('submit:', sub);
    await sleep(9000);
    const fin = await c.eval(`JSON.stringify({url: location.href.slice(0,90), body: (document.body.innerText||'').slice(0,220)})`);
    console.log('fin:', fin);
  }
}
c.close?.();
process.exit(0);

// _w1800_a2p_all.mjs — a2place 剩余6格批量 (500=入库模式)
import { execSync } from 'child_process';
import fs from 'fs';
const tasks = [
  ['t4', 'AI Image Editor Free – Edit Photos with AI Online', 'https://www.aiimageeditorfree.org', 'Edit photos online for free with AI. Remove backgrounds, upscale resolution, retouch portraits and apply smart filters – no software download or design skills needed.'],
  ['t5', 'AI Tools Directory – Best Free AI Tools List 2026', 'https://aitoolsdirectory.vip', 'Browse a curated directory of the best AI tools for writing, image generation, video creation and productivity. Free listings, daily updates, no sign-up needed to explore.'],
  ['t7', 'Zakaihu – Tech Reviews and AI Product Guides', 'https://zakaihu.com', 'In-depth tech reviews, AI product guides and hands-on comparisons. Zakaihu helps you pick the right gadgets and software with honest, practical analysis.'],
  ['t8', 'Generator for House – Home Generator Buying Guide', 'https://generatorforhouse.org', 'Complete home generator buying guide: portable vs standby units, wattage calculators, fuel type comparisons and installation tips to keep your house powered during outages.'],
  ['t9', 'Spravs – Electronics Reviews and Buying Advice', 'https://spravs.com', 'Spravs publishes electronics reviews, buying advice and comparison charts for consumer gadgets, smart home devices and everyday tech, updated by real users.'],
  ['t10', 'QR Code Generator – Free Custom QR Codes Online', 'https://qrcodegenerator.vip', 'Create free custom QR codes online in seconds. Static and dynamic QR codes with logo, colors and download in PNG or SVG – no registration required.'],
];
for (const [tid, title, url, desc] of tasks) {
  try {
    const ck = `/tmp/a2p_${tid}.ck`, pg = `/tmp/a2p_${tid}.html`;
    execSync(`curl -s --max-time 30 -x http://127.0.0.1:5780 -c ${ck} "https://www.a2place.com/submit?c=51&LINK_TYPE=1" -o ${pg}`);
    const html = fs.readFileSync(pg, 'utf8');
    const m = html.match(/([0-9]+) ?([+*-]) ?([0-9]+) ?=/);
    if (!m) { console.log(tid, 'MATH_FAIL'); continue; }
    const ans = eval(m[1] + m[2] + m[3]);
    const esc = s => s.replace(/"/g, '\\"');
    const r = execSync(`curl -s --max-time 30 -x http://127.0.0.1:5780 -b ${ck} -e "https://www.a2place.com/submit?c=51&LINK_TYPE=1" "https://www.a2place.com/submit" -F "LINK_TYPE=1" -F "TITLE=${esc(title)}" -F "URL=${url}" -F "DESCRIPTION=${esc(desc)}" -F "OWNER_NAME=leoxm26" -F "OWNER_EMAIL=a2place.genhouse@387654.com" -F "CATEGORY_ID=51" -F "ADD_CATEGORY_ID[]=51" -F "RECPR_URL=" -F "AGREERULES=on" -F "DO_MATH=${ans}" -F "formSubmitted=1" -F "continue=Continue" -o /tmp/a2p_${tid}_resp.html -w "%{http_code}"`).toString();
    const resp = fs.readFileSync(`/tmp/a2p_${tid}_resp.html`, 'utf8');
    const hit = resp.match(/Link submitted[^<.]*|already exists[^<]*|error[^<]{0,60}/i);
    console.log(tid, 'http=' + r, hit ? hit[0].slice(0, 70) : 'no-receipt');
  } catch (e) { console.log(tid, 'ERR', e.message.slice(0, 60)); }
  await new Promise(r => setTimeout(r, 4000));
}

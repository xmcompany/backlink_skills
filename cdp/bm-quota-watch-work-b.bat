@echo off
rem B-machine variant of bm-quota-watch-work.bat (Tmax butler, 2026-09-22 takeover).
rem Differences vs C original (kept in git for C machine):
rem   - node lives at C:\nvm4w\nodejs\node.exe (no C:\Program Files\nodejs on B)
rem   - HOME/USERPROFILE = C:\Users\xiesiwei (B interactive user owns .zcode)
rem   - poke/rescue/resume use D:\Github\seoadminB (B repo; C uses seoadminC)
rem   - 9227 chrome heal runs ensure-bm-9227.mjs DIRECTLY (watch task already runs
rem     as xiesiwei so the relaunch inherits the right DPAPI context; C needs the
rem     bm-9227-heal schtasks delegation because its watch runs as SYSTEM)
rem step -2: manual-pause gate (bm-pause.flag = whole quota system paused)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quiet-window.php
if %errorlevel%==1 exit /b
set "HOME=C:\Users\xiesiwei"
set "USERPROFILE=C:\Users\xiesiwei"
rem step -1: keep-alive for the dedicated 9227 chrome (own profile, direct:// proxy
rem so quota queries NEVER ride the VPN system proxy - user directive 2026-09-22)
curl -s -m 3 http://127.0.0.1:9227/json/version >nul 2>&1
if %errorlevel%==1 "C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-bm-9227.mjs >> D:\Github\backlink_skills\cdp\bm-watch.log 2>&1
rem step 1: window + throttle gate
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-gate.php
if not %errorlevel%==1 goto :end
rem step 2: api sample -> bm-last.json (9227 dedicated instance)
"C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
rem step 2.5: 9227 self-heal (cooldown 600s in bm-chrome-heal.php; heal = direct relaunch)
findstr /C:"CHROME_DOWN" /C:"ALL_PORTS_DOWN" D:\Github\backlink_skills\cdp\bm-last.json >nul 2>&1
if errorlevel 1 goto :record
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-chrome-heal.php
if not %errorlevel%==1 goto :record
"C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-bm-9227.mjs >> D:\Github\backlink_skills\cdp\bm-watch.log 2>&1
rem healed -> immediate re-sample so this round still lands (voucher rescue window needs data)
"C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
:record
rem step 3: db insert + decision (0=normal 2=use voucher 3=poke timer 4=resume 5=rescue push)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-record.php
set REC=%errorlevel%
if %REC%==2 (
  "C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-voucher-use.mjs > D:\Github\backlink_skills\cdp\bm-use-last.out 2>&1
)
if %REC%==3 (
  rem poke: burn plan tokens via the real ZCode client (B machine IS logged into Tmax)
  "C:\nvm4w\nodejs\node.exe" "D:\Program Files\ZCode\resources\glm\zcode.cjs" -p "ok" --cwd D:\Github\seoadminB > D:\Github\backlink_skills\cdp\bm-poke-last.out 2>&1
  "C:\nvm4w\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
  C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-record.php
)
if %REC%==5 (
  rem cutoff rescue: push everything already saved to RDS
  C:\BtSoft\php\82\php.exe D:\Github\seoadminB\artisan seoadmin:sync-rds --direction=push --limit=2000 > D:\Github\backlink_skills\cdp\bm-rescue-push.out 2>&1
)
if %REC%==4 (
  rem quota recovered after cutoff: async relaunch (playbook-b, B window defs come from DB)
  start "" /min cmd /c D:\Github\backlink_skills\cdp\bm-resume-launch-b.bat
)
:end
rem step 4: heartbeat trail
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-summary.php >> D:\Github\backlink_skills\cdp\bm-quota-watch-work.log 2>&1

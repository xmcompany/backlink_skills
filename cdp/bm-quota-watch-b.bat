@echo off
rem B-machine variant (xiesiwei, 2026-09-22 Tmax butler takeover from C).
rem Detach-launcher for the 1-min quota watch pipeline. On B the schtasks task
rem "bm-quota-watch" runs as the INTERACTIVE user xiesiwei (not SYSTEM like on C),
rem so: chrome heal is a direct same-user node call (DPAPI-stable, no bm-9227-heal
rem delegation task needed) and HOME stays xiesiwei where .zcode lives (poke works).
set "HOME=C:\Users\xiesiwei"
set "USERPROFILE=C:\Users\xiesiwei"
start "" /min cmd /c D:\Github\backlink_skills\cdp\bm-quota-watch-work-b.bat
exit /b

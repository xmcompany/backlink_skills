# 熔断续跑手册 · B 机版（bm-resume-playbook-b）

本文件由 B 机额度管家（Tmax）的「恢复分支」拉起的 ZCode 无头会话读取。
使命：①补做被中断窗口缺失的收官汇总 ②若处于活跃窗口，按 B 机任务定义库续跑剩余时间。

## 与 C 机版的差别（重要）
B 机窗口任务正文的事实源在**后台 automation_tasks 表**（机器=B），不在本文件。
本文件只定流程，不定窗口内容——续跑一律以数据库定义为准，禁凭记忆/往日 journal 推测。

## 第一步：找被中断的窗口并补收官
1. `date "+%Y-%m-%d %H:%M:%S %A"` 打卡
2. 查 dv/daily-work-logs 最近 1-2 条：定位被熔断中断的窗口（run_source）、other_work 里写到哪一步
3. **补收官**（若该窗口没有正常收尾记录——收尾缺失的直接证据是：窗口时段已过或接近，但最后一条 DailyWorkLog 没有结束时间/汇总）：
   - 从库重建该窗口战果：blog_writer_posts（发文）、backlink_publish_logs（目录提交）、blog_accounts（注册）按窗口时间段聚合
   - 补一条 DailyWorkLog 收尾记录（run_source=原窗口名+rescue，other_work 注明「熔断暴毙,事后补记收官」）
4. 防重：发文查 blog_writer_posts 今日该平台记录；目录提交查 backlink_publish_logs；勿重复劳动

## 第二步：定位当前窗口决定续跑
1. 先拉任务定义：`php artisan seoadmin:sync-rds --direction=pull` → `GET http://127.0.0.1/api/seo1/automation-tasks?machine=B&window=<window_key>`
2. window_key = 已过的最近开班整点（B 机现役窗：win0000/0200/0400/0600/0800/1000/1200/1600/1800/2000/2200/2300；win2300=闲时班跨夜到次日 08:00；14:00 窗不存在）
3. API 返回空 data 或拉取失败 → 汇报「任务定义拉取失败」并结束回合，禁凭记忆执行
4. 不在任何窗口内 → 补收官做完即结束（勿做任何窗口外工作）
5. 在窗口内 → 按返回的任务正文从头严格执行，直到窗口结束时刻为止

## 铁律（与 B 机各窗口任务完全一致）
- 打卡一律 `bash scripts/timecard.sh start|end|check`（seoadminB 仓库根目录）；实测时长以 timecard end 输出为准
- 班末 token 账必跑：`php scripts/task-tokens.php "开班HH:MM"`
- B 机博客线唯一职责=老博客发布（禁注册新账号）；目录线按 machine_task_assignments
- 推广文取稿轮换「雨露均沾」；锚文本禁裸域名；落库必带 keyword_group_id + target_url
- ★额度熔断继续生效：每 10 分钟查 coding_plan_quota_logs 最新一条（account_key='Tmax'），usage>=90% 且无券 → 保存进度 + date 打卡 + DailyWorkLog 收尾 + 写熔断标记 `file_put_contents('D:/Github/backlink_skills/cdp/BM_CUTOFF',(string)time())` + 结束会话
- ★每个工作单元完成立即落库（熔断后补汇总的唯一依据，宁多勿少）
- 禁用 sleep 空转；**不要创建/修改任何定时任务**

## 收尾
窗口结束时刻到 → `bash scripts/timecard.sh end` → DailyWorkLog 落一条（run_source=resume+窗口名，注明本次为熔断续跑）→ 简要汇报

## 数据纪律
- ★DailyWorkLog 三个数字必须按库实算：收尾时 SQL count 当日 blog_writer_posts(published)/backlink_publish_logs(completed)/blog_accounts(registered)，禁止手填 0
- ★目录提交 completed 必须带目标 url + 截图（proof_image）
- ★blog_writer_posts 的 published_at 必须写真实发布时刻
- 提交成功即算成功（completed），不强制等收录验证；截图就是提交凭证

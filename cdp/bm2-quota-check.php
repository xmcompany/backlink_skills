<?php
/**
 * bm2-quota-check.php — B 机账号2管家（D 独立账号, account_key='d-独立'）
 *
 * 2026-09-21 部署（用户定稿额度管家改造 B 分支）：
 * - 采样源：bigmodel.cn 纯 HTTP API（Bearer = bm-cookie-manual.json 的 JWT, 由
 *   SEO Data Collector 扩展「智谱」tab 经 seoadminB ZhipuCookieController 回存）,
 *   不依赖浏览器 DOM——9226 专属 Chrome 仅作自持登录容器（独立 user-data-dir +
 *   --proxy-server=direct://, 不走 airtcp 系统代理防账号 IP 漂移）。
 * - 作息（同 C 机定稿）：周末全天 + 工作日 18:00-09:00 = 常规监控（5 分钟一采）；
 *   工作日 09:00-18:00 = 只在重置点前后各采样一次（前 ~10 分钟 / 后 ~5 分钟）；
 *   cookie 文件变化（用户刷新登录）= 立即测试采样一次验证。
 * - 写入 coding_plan_quota_logs 带 account_key='d-独立' + sync_uuid（RDS 同步）。
 * - 到期提醒：可用重置券 36h 内到期 → bm2-watch.log ALERT 行。
 * - 9226 保活：CDP 端口探测, 死了按 direct:// 参数拉起。
 * - poke 计时激活不归本机（只有 ZCode 登录账号2 的 D 机能做, 任务书已知边界）。
 *
 * 用法：php bm2-quota-check.php [force]   force=无视作息立即采样
 * 调度：Windows 计划任务 Bm2QuotaCheckB 每 5 分钟（脚本内自行按作息裁剪）
 */

date_default_timezone_set('Asia/Shanghai');

const ACCOUNT_KEY = 'd-独立';
const COOKIE_FILE = 'D:/Github/backlink_skills/cdp/bm-cookie-manual.json';
const STATE_FILE  = 'D:/Github/backlink_skills/cdp/bm2-state.json';
const LOG_FILE    = 'D:/Github/backlink_skills/cdp/bm2-watch.log';
const ENV_FILE    = 'D:/Github/seoadminB/.env';
const CDP_PORT    = 9226;
const VOUCHER_ALERT_HOURS = 36;   // 临期券提醒窗口
const RESET_BEFORE_MIN    = 12;   // 重置前采样窗口（任务书 ~10 分钟, 留余量）
const RESET_AFTER_MIN     = 8;    // 重置后采样窗口（任务书 ~5 分钟, 留余量）

$force = false;
foreach (array_slice($GLOBALS['argv'] ?? [], 1) as $a) {
    if ($a === 'force' || $a === 'force=1') $force = true;
}

function log_line(string $s): void {
    @file_put_contents(LOG_FILE, '[' . date('m-d H:i:s') . '] ' . $s . "\n", FILE_APPEND | LOCK_EX);
}

function state_read(): array {
    $d = @json_decode((string) @file_get_contents(STATE_FILE), true);
    return is_array($d) ? $d : [];
}
function state_write(array $d): void {
    @file_put_contents(STATE_FILE, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

/** @return array{host:string,port:int,db:string,user:string,pass:string} */
function db_conf(): array {
    // Laravel .env 含括号/引号等字符, parse_ini_file 会语法报错——手工逐行解析
    $env = [];
    foreach (@file(ENV_FILE) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v, " \t\"'");
    }
    return [
        'host' => $env['DB_HOST'] ?? '127.0.0.1',
        'port' => (int) ($env['DB_PORT'] ?? 3306),
        'db'   => $env['DB_DATABASE'] ?? '',
        'user' => $env['DB_USERNAME'] ?? '',
        'pass' => $env['DB_PASSWORD'] ?? '',
    ];
}

function pdo(): PDO {
    $c = db_conf();
    $pdo = new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['db']};charset=utf8mb4", $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 8,
    ]);
    return $pdo;
}

function uuid4(): string {
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

/** 作息：true=常规监控时段（周末全天 / 工作日 18:00-09:00） */
function in_regular_hours(): bool {
    $dow = (int) date('N'); // 7=周日 6=周六
    $hour = (int) date('G');
    return $dow >= 6 || $hour >= 18 || $hour < 9;
}

/** 最近一次采样的 reset_at（HH:MM）；无历史返回 null */
function last_reset_at(): ?string {
    try {
        $st = pdo()->prepare("SELECT reset_at FROM coding_plan_quota_logs WHERE account_key = ? AND reset_at IS NOT NULL AND reset_at <> '' ORDER BY id DESC LIMIT 1");
        $st->execute([ACCOUNT_KEY]);
        $v = $st->fetchColumn();
        return $v === false ? null : (string) $v;
    } catch (Throwable $e) {
        return null;
    }
}

/** 静默时段（工作日白天）是否落在重置点前后窗口 */
function near_reset_point(?string $resetHHMM): bool {
    if (!$resetHHMM || !preg_match('/^(\d{1,2}):(\d{2})$/', $resetHHMM, $m)) return false;
    $now = new DateTime('now');
    $reset = new DateTime('today ' . $resetHHMM);
    $diff = ($now->getTimestamp() - $reset->getTimestamp()) / 60; // 分钟, 负=重置前
    return $diff >= -RESET_BEFORE_MIN && $diff <= RESET_AFTER_MIN;
}

/** bigmodel API 采样：quota/limit + 券列表 */
function sample_api(string $jwt): array {
    $opts = static function (string $url) use ($jwt) {
        return [
            'http' => [
                'method' => 'GET',
                'header' => "Authorization: Bearer {$jwt}\r\n"
                    . "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36\r\n"
                    . "Referer: https://bigmodel.cn/coding-plan/personal/usage\r\n"
                    . "Accept: application/json\r\n",
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ];
    };
    $ctx = stream_context_create($opts('q'));
    $raw = @file_get_contents('https://bigmodel.cn/api/monitor/usage/quota/limit', false, $ctx);
    if ($raw === false) throw new RuntimeException('quota/limit 网络失败');
    $j = json_decode($raw, true);
    if (($j['code'] ?? 0) != 200) throw new RuntimeException('quota/limit ' . ($j['msg'] ?? substr($raw, 0, 120)));
    $tokens = null;
    foreach ($j['data']['limits'] ?? [] as $l) {
        if (($l['type'] ?? '') === 'TOKENS_LIMIT') { $tokens = $l; break; }
    }
    if (!$tokens) throw new RuntimeException('limits 无 TOKENS_LIMIT');

    $ctx2 = stream_context_create($opts('v'));
    $raw2 = @file_get_contents('https://bigmodel.cn/api/biz/customer-package-reset/list?targetType=PERSONAL', false, $ctx2);
    $j2 = $raw2 === false ? null : json_decode($raw2, true);
    $vouchers = [];
    if (($j2['code'] ?? 0) == 200) {
        foreach (['fiveHourResets', 'weekResets'] as $k) {
            foreach ($j2['data'][$k] ?? [] as $v) {
                if (!empty($v['available'])) $vouchers[] = (string) $v['expireTime'];
            }
        }
        sort($vouchers);
    }
    $resetAt = '';
    if (!empty($tokens['nextResetTime'])) {
        $resetAt = date('H:i', (int) ((int) $tokens['nextResetTime'] / 1000));
    }
    return [
        'usage_percent' => (int) $tokens['percentage'],
        'reset_at' => $resetAt,
        'voucher_count' => count($vouchers),
        'voucher_expire_at' => $vouchers[0] ?? null,
        'level' => $j['data']['level'] ?? null,
    ];
}

function keepalive_9226(): string {
    $alive = @file_get_contents('http://127.0.0.1:' . CDP_PORT . '/json/version', false, stream_context_create(['http' => ['timeout' => 2]]));
    if ($alive !== false) return 'alive';
    $ps = "Start-Process 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ArgumentList "
        . "'--remote-debugging-port=" . CDP_PORT . "',"
        . "'--proxy-server=direct://',"
        . "'--user-data-dir=D:\\Github\\backlink_skills\\cdp\\profile-" . CDP_PORT . "',"
        . "'--no-first-run','--no-default-browser-check','--window-size=1380,900','about:blank'";
    exec('powershell -NoProfile -Command "' . $ps . '" 2>&1', $o, $rc);
    log_line('KEEPALIVE-9226 relaunch rc=' . $rc);
    return $rc === 0 ? 'relaunched' : 'relaunch-fail';
}

// ── 主流程 ─────────────────────────────────────────────
$state = state_read();
$cookieMtime = @filemtime(COOKIE_FILE);
$man = $cookieMtime ? @json_decode((string) @file_get_contents(COOKIE_FILE), true) : null;
$jwt = $man['cookie']['value'] ?? '';

$out = ['account' => ACCOUNT_KEY, 'ts' => date('Y-m-d H:i:s')];

if ($jwt === '') {
    log_line('NO-COOKIE bm-cookie-manual.json 缺失或无 value（用户未在 SEO Data Collector 智谱 tab 刷新登录）');
    $out['action'] = 'no-cookie';
    echo json_encode($out, JSON_UNESCAPED_UNICODE), "\n";
    exit(1);
}

$cookieChanged = ($state['cookie_mtime'] ?? 0) != $cookieMtime;

// 9226 保活（任何时段都保, 自持登录容器不能死——静默跳过也要先保活）
$out['chrome9226'] = keepalive_9226();

// 作息裁剪
$regular = in_regular_hours();
if (!$force && !$cookieChanged) {
    if ($regular) {
        // 常规时段：每次都采
    } elseif (!near_reset_point(last_reset_at())) {
        $out['action'] = 'skipped-quiet-hours';
        echo json_encode($out, JSON_UNESCAPED_UNICODE), "\n";
        exit(0);
    } else {
        $out['trigger'] = 'reset-point';
    }
} else {
    $out['trigger'] = $force ? 'force' : 'cookie-refresh';
    // cookie 刷新：同步注入 9226 专属 Chrome, 保持自持登录容器与 API 同源
    exec('node D:/Github/backlink_skills/cdp/bm2-cookie-inject.mjs 2>&1', $injOut, $injRc);
    log_line('COOKIE-REFRESH inject9226 rc=' . $injRc . ' ' . implode(' | ', array_slice($injOut, 0, 2)));
}

// 采样
try {
    $s = sample_api($jwt);
} catch (Throwable $e) {
    log_line('SAMPLE-FAIL ' . $e->getMessage());
    $out['action'] = 'sample-fail';
    $out['error'] = $e->getMessage();
    echo json_encode($out, JSON_UNESCAPED_UNICODE), "\n";
    exit(2);
}

// 落库
try {
    $pdo = pdo();
    $st = $pdo->prepare("INSERT INTO coding_plan_quota_logs
        (usage_percent, has_voucher, voucher_count, voucher_expire_at, reset_at, page_refreshed_at, in_gift_window, sync_uuid, account_key, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())");
    $st->execute([
        $s['usage_percent'],
        $s['voucher_count'] > 0 ? 1 : 0,
        $s['voucher_count'],
        $s['voucher_expire_at'],
        $s['reset_at'],
        date('Y-m-d H:i:s'),
        $regular ? 1 : 0,
        uuid4(),
        ACCOUNT_KEY,
    ]);
    $out['row_id'] = (int) $pdo->lastInsertId();
} catch (Throwable $e) {
    log_line('DB-FAIL ' . $e->getMessage());
    $out['action'] = 'db-fail';
    $out['error'] = $e->getMessage();
    echo json_encode($out, JSON_UNESCAPED_UNICODE), "\n";
    exit(3);
}

state_write(['cookie_mtime' => $cookieMtime, 'last_sample' => date('Y-m-d H:i:s'), 'last_reset_at' => $s['reset_at']]);

// 临期券提醒
if ($s['voucher_count'] > 0 && $s['voucher_expire_at']) {
    $exp = strtotime($s['voucher_expire_at']);
    $hoursLeft = ($exp - time()) / 3600;
    if ($hoursLeft <= VOUCHER_ALERT_HOURS) {
        log_line(sprintf('ALERT-VOUCHER-EXPIRY 账号2 有 %d 张可用券, 最近一张 %s 到期（剩 %.1fh）——poke 激活只能 D 机做, 请安排', $s['voucher_count'], $s['voucher_expire_at'], $hoursLeft));
        $out['voucher_alert'] = round($hoursLeft, 1) . 'h';
    }
}

log_line(sprintf('SAMPLED usage=%d%% reset=%s vouchers=%d level=%s trigger=%s row=%d',
    $s['usage_percent'], $s['reset_at'] ?: '-', $s['voucher_count'], $s['level'] ?? '?', $out['trigger'] ?? 'regular', $out['row_id']));

$out['action'] = 'sampled';
$out += $s;
echo json_encode($out, JSON_UNESCAPED_UNICODE), "\n";

<?php
/**
 * daily-publish-plan.php — 当日发文位清单（20:30 班/1号线开班弹药清点用）
 * 用法: php daily-publish-plan.php [cookie目录默认D:/Github/backlink_skills/cookies/default]
 * 输出: B机 registered 且今日未发的平台 + 近期发文数 + cookie 有无
 */
require __DIR__ . '/../../seoadminB/vendor/autoload.php';
$app = require __DIR__ . '/../../seoadminB/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$cookieDir = $argv[1] ?? 'D:/Github/backlink_skills/cookies/default';
$cAccts = [62, 107, 108, 106, 157, 158, 77, 204, 60 + 1000]; // C机账号黑名单(60+1000占位防误合)
$cPlatforms = ['substack', 'hatena', 'qiita', 'habr', 'pika', 'rant', 'wattpad'];

$rows = DB::table('blog_accounts')->whereIn('status', ['registered', 'verified', 'active'])
    ->orderByDesc('dr')->get(['id', 'platform', 'domain', 'username', 'dr', 'last_published_at', 'remark']);
foreach ($rows as $r) {
    $isC = in_array($r->id, $cAccts) || in_array(strtolower($r->platform), $cPlatforms);
    $sentToday = $r->last_published_at && substr($r->last_published_at, 0, 10) === date('Y-m-d');
    $cookieFile = "{$cookieDir}/" . str_replace('www.', '', strtolower($r->domain ?: $r->platform . '.com')) . '.json';
    $hasCookie = file_exists($cookieFile) ? 'Y' : (file_exists(preg_replace('/\.com\.json$/', '.io.json', $cookieFile)) ? 'Y(io)' : 'N');
    $recent = DB::table('blog_writer_posts')->where('blog_account_id', $r->id)->where('published_at', '>=', now()->subDays(7))->count();
    printf("#%-4d %-14s dr=%-3d %s sent=%s cookie=%s 7d_posts=%d %s\n",
        $r->id, $r->platform, $r->dr, $isC ? '[C机勿用]' : '[B可用] ',
        $sentToday ? 'YES' : 'no  ', $hasCookie, $recent, mb_substr((string) $r->remark, 0, 30));
}
echo "\n今日银行可选稿(draft最老5): \n";
$pubTitles = DB::table('blog_writer_posts')->where('status', 'published')->pluck('title')->map(function ($t) { return mb_strtolower(trim((string) $t)); })->all();
$drafts = DB::table('blog_writer_posts')->where('status', 'draft')->whereIn('keyword_group_id', [101, 98, 104])->orderBy('id')->get(['id', 'title', 'keyword_group_id']);
$n = 0;
foreach ($drafts as $d) {
    $t = mb_strtolower(trim((string) $d->title));
    if ($t === '' || in_array($t, $pubTitles, true)) continue;
    echo "  #{$d->id} grp={$d->keyword_group_id} " . mb_substr($d->title, 0, 50) . "\n";
    if (++$n >= 5) break;
}

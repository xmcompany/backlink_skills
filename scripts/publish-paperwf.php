<?php
/**
 * publish-paperwf.php — paper.wf(writefreely) API 参数化发文工具
 * 用法: php publish-paperwf.php <draftId>
 * 流程: 取银行稿 → 标题查重 → HTML转md → collection端点发(slug自动生成) → 线上锚链验证 → 回写 blog_writer_posts
 * 配方来源: lessons.json proven/paper.wf (2026-08-30 win1230 实测修正版)
 * 注意: 本地库=D:\Github\seoadminB (B机)；账号id=179 leoxm
 */
require __DIR__ . '/../../seoadminB/vendor/autoload.php';
$app = require __DIR__ . '/../../seoadminB/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$BASE = 'https://paper.wf';
$draftId = $argv[1] ?? null;
if (!$draftId) { echo "usage: php publish-paperwf.php <draftId>\n"; exit(1); }

function html2md($html) {
    $t = $html;
    $t = preg_replace('/<br\s*\/?>/i', "\n\n", $t);
    $t = preg_replace('/<h2[^>]*>/i', "\n\n## ", $t); $t = preg_replace('/<\/h2>/i', "\n\n", $t);
    $t = preg_replace('/<h3[^>]*>/i', "\n\n### ", $t); $t = preg_replace('/<\/h3>/i', "\n\n", $t);
    $t = preg_replace('/<p[^>]*>/i', "\n\n", $t); $t = preg_replace('/<\/p>/i', "\n\n", $t);
    $t = preg_replace('/<(strong|b)>/i', '**', $t); $t = preg_replace('/<\/(strong|b)>/i', '**', $t);
    $t = preg_replace('/<(em|i)>/i', '*', $t); $t = preg_replace('/<\/(em|i)>/i', '*', $t);
    $t = preg_replace('/<li[^>]*>/i', "\n- ", $t); $t = preg_replace('/<\/li>/i', "", $t);
    $t = preg_replace('/<\/?[uo]l[^>]*>/i', "\n\n", $t);
    $t = preg_replace('/<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is', '[$2]($1)', $t);
    $t = preg_replace('/<blockquote[^>]*>/i', '> ', $t); $t = preg_replace('/<\/blockquote>/i', "\n\n", $t);
    $t = preg_replace('/<!--.*?-->/s', '', $t);
    $t = preg_replace('/\n{3,}/', "\n\n", $t);
    return trim($t);
}

$post = DB::table('blog_writer_posts')->where('id', $draftId)->first();
if (!$post || $post->status !== 'draft') { echo "DRAFT_NOT_FOUND_OR_NOT_DRAFT #{$draftId}\n"; exit(1); }
if (DB::table('blog_writer_posts')->where('status', 'published')->where('title', $post->title)->count()) {
    echo "DUP_TITLE #{$draftId}\n"; exit(1);
}

$ch = curl_init("$BASE/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>20, CURLOPT_POST=>1,
  CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
  CURLOPT_POSTFIELDS=>json_encode(['alias'=>'leoxm','pass'=>'Pwf26#2026x'])]);
$token = json_decode(curl_exec($ch), true)['data']['access_token'] ?? null; curl_close($ch);
if (!$token) { echo "LOGIN_FAIL\n"; exit(1); }

$md = html2md($post->body);
$ch = curl_init("$BASE/api/collections/leoxm/posts");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>30, CURLOPT_POST=>1,
  CURLOPT_HTTPHEADER=>['Content-Type: application/json', "Authorization: Token $token"],
  CURLOPT_POSTFIELDS=>json_encode(['title'=>$post->title, 'body'=>$md])]);
$resp = json_decode(curl_exec($ch), true); curl_close($ch);
$pid = $resp['data']['id'] ?? null; $slug = $resp['data']['slug'] ?? null;
if (!$pid || !$slug) { echo "POST_FAIL ", substr(json_encode($resp), 0, 200), "\n"; exit(1); }

$url = "$BASE/leoxm/$slug";
sleep(3);
$c = curl_init($url); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>15, CURLOPT_FOLLOWLOCATION=>1]);
$html = curl_exec($c); $code = curl_getinfo($c, CURLINFO_RESPONSE_CODE); curl_close($c);
$anchorOk = $post->target_url && strpos($html, $post->target_url) !== false;

if ($code === 200 && $anchorOk) {
    DB::table('blog_writer_posts')->where('id', $draftId)->update([
        'status'=>'published', 'published_url'=>$url, 'published_at'=>now(), 'updated_at'=>now()]);
    DB::table('blog_accounts')->where('id', 179)->update(['last_published_at'=>now(), 'updated_at'=>now()]);
    echo "OK #{$draftId} {$url} anchor=YES\n";
} else {
    echo "VERIFY_FAIL code={$code} anchor=" . ($anchorOk ? 'YES' : 'NO') . " url={$url} (未回写,人工核查)\n";
}

<?php
// _r0200_dupe.php — 注册前防撞检查（reg0200 撞号事故后新增，真壳直攻前必跑）
// 用法: php _r0200_dupe.php <domain> <emailPrefix>
// 语义（2026-09-08 reg0200 修正）: 铁律=每台电脑×每平台一个有效账号——三机各一号合法。
//   只拦本机(machine=B)同平台活账号或同邮箱前缀; 其他机器占号仅提示不拦。
// 退出码: 0=可注册  1=禁止注册(本机已有活账号或同邮箱)
require 'D:/Github/seoadminB/vendor/autoload.php';
$app = require 'D:/Github/seoadminB/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$domain, $prefix] = array_slice($argv, 1, 2);
$email = $prefix.'@387654.com';
$dead = ['disabled','banned','suspended','blocked'];

$hits = DB::table('blog_accounts')
    ->where('platform', $domain)->orWhere('domain', $domain)->orWhere('email', $email)
    ->get(['id','platform','email','username','status','machine']);

$block = false;
foreach ($hits as $h) {
    $isDead = in_array($h->status, $dead);
    $isMine = $h->machine === 'B';
    $sameEmail = $h->email === $email;
    echo ($isDead ? 'HIT-DEAD' : ($isMine ? 'HIT-MINE' : 'HIT-OTHER')).": #{$h->id} {$h->platform} {$h->email} {$h->username} status={$h->status} machine={$h->machine}\n";
    if (!$isDead && ($isMine || $sameEmail)) $block = true;   // 本机活账号 或 任意机同邮箱 → 禁
}
if ($block) { echo "BLOCKED: 本机已有同平台活账号/同邮箱(或撞号风险), 禁止注册\n"; exit(1); }
if ($hits->isNotEmpty()) { echo "OK: 其他机器已占号(三机各一号合法), 本机可注册——注意平台当日总量与farm风控\n"; exit(0); }
echo "CLEAN: {$domain} / {$email} 无任何账号, 可注册\n";
exit(0);

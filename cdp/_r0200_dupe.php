<?php
// _r0200_dupe.php — 注册前全库防撞检查（reg0200 撞号事故后新增，真壳直攻前必跑）
// 用法: php _r0200_dupe.php <domain> <emailPrefix>
// 退出码: 0=无撞可注册  1=有撞禁止注册
require 'D:/Github/seoadminB/vendor/autoload.php';
$app = require 'D:/Github/seoadminB/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$domain, $prefix] = array_slice($argv, 1, 2);
$email = $prefix.'@387654.com';

$hits = DB::table('blog_accounts')
    ->where('platform', $domain)
    ->orWhere('domain', $domain)
    ->orWhere('email', $email)
    ->get(['id', 'platform', 'email', 'username', 'status', 'machine']);

if ($hits->isEmpty()) { echo "CLEAN: {$domain} / {$email} 无撞，可注册\n"; exit(0); }

$dead = ['disabled','banned','suspended','blocked'];
$live = $hits->filter(fn($h) => !in_array($h->status, $dead));
foreach ($hits as $h) {
    echo "HIT: #{$h->id} {$h->platform} {$h->email} {$h->username} status={$h->status} machine={$h->machine}\n";
}
if ($live->isNotEmpty()) { echo "BLOCKED: 同平台/同邮箱已有活账号（含其他机），禁止注册\n"; exit(1); }
echo "ONLY-DEAD: 仅有死账号，可注册（旧号已释放名额）\n";
exit(0);

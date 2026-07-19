<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Cần `php artisan schedule:work` (dev) hoặc cron OS thật gọi
 * `php artisan schedule:run` mỗi phút (production) để chạy tự động.
 */
Schedule::command('datban:xu-ly-qua-han')
    ->everyMinute()
    ->withoutOverlapping();

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))

    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
    )

    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->alias([
            'role'   => \App\Http\Middleware\RoleMiddleware::class,  // giữ lại nếu còn dùng
            'member' => \App\Http\Middleware\MemberMiddleware::class,
            'staff'  => \App\Http\Middleware\StaffMiddleware::class,
        ]);

    })

    ->withExceptions(function (Exceptions $exceptions): void {

    })

    ->create();
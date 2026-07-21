<?php

namespace App\Providers;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Services\PhoneVerification\FirebasePhoneVerificationProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Cho phép thay Firebase bằng nhà cung cấp khác sau này chỉ bằng
        // cách đổi binding ở đây, không phải sửa AuthController.
        $this->app->bind(
            PhoneVerificationProviderInterface::class,
            FirebasePhoneVerificationProvider::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

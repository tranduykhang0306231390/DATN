<?php

namespace Tests\Unit;

use App\Models\KhachHang;
use App\Services\PasswordResetTokenService;
use Carbon\Carbon;
use Tests\TestCase;

class PasswordResetTokenServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_token_is_valid_only_for_the_customer_and_current_password(): void
    {
        Carbon::setTestNow('2026-07-18 10:00:00');
        $service = app(PasswordResetTokenService::class);
        $customer = $this->customer('KH001', 'old-hash');
        $token = $service->create($customer);

        $this->assertTrue($service->isValid($token, $customer));
        $this->assertFalse($service->isValid($token, $this->customer('KH002', 'old-hash')));
        $this->assertFalse($service->isValid($token, $this->customer('KH001', 'new-hash')));
        $this->assertFalse($service->isValid('invalid-token', $customer));
    }

    public function test_token_expires_after_ten_minutes(): void
    {
        Carbon::setTestNow('2026-07-18 10:00:00');
        $service = app(PasswordResetTokenService::class);
        $customer = $this->customer('KH001', 'password-hash');
        $token = $service->create($customer);

        Carbon::setTestNow('2026-07-18 10:11:00');

        $this->assertFalse($service->isValid($token, $customer));
    }

    private function customer(string $id, string $passwordHash): KhachHang
    {
        $customer = new KhachHang();
        $customer->MaKhachHang = $id;
        $customer->MatKhau = $passwordHash;

        return $customer;
    }
}

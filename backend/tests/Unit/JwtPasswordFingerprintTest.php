<?php

namespace Tests\Unit;

use App\Models\KhachHang;
use App\Models\NhanVien;
use Tests\TestCase;

class JwtPasswordFingerprintTest extends TestCase
{
    public function test_customer_password_fingerprint_changes_with_password_hash(): void
    {
        $customer = new KhachHang(['MatKhau' => 'hash-one']);
        $first = $customer->getJWTCustomClaims()['password_fingerprint'];

        $customer->MatKhau = 'hash-two';

        $this->assertNotSame(
            $first,
            $customer->getJWTCustomClaims()['password_fingerprint']
        );
    }

    public function test_staff_password_fingerprint_changes_with_password_hash(): void
    {
        $staff = new NhanVien(['MatKhau' => 'hash-one']);
        $first = $staff->getJWTCustomClaims()['password_fingerprint'];

        $staff->MatKhau = 'hash-two';

        $this->assertNotSame(
            $first,
            $staff->getJWTCustomClaims()['password_fingerprint']
        );
    }
}

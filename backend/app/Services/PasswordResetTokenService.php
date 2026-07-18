<?php

namespace App\Services;

use App\Models\KhachHang;
use Illuminate\Support\Facades\Crypt;

class PasswordResetTokenService
{
    public const TTL_MINUTES = 10;

    public function create(KhachHang $customer): string
    {
        return Crypt::encryptString(json_encode([
            'customer_id' => $customer->MaKhachHang,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES)->timestamp,
            'password_fingerprint' => hash('sha256', $customer->MatKhau),
        ], JSON_THROW_ON_ERROR));
    }

    public function isValid(string $token, KhachHang $customer): bool
    {
        try {
            $payload = json_decode(
                Crypt::decryptString($token),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            return is_array($payload)
                && ($payload['customer_id'] ?? null) === $customer->MaKhachHang
                && (int) ($payload['expires_at'] ?? 0) >= now()->timestamp
                && hash_equals(
                    hash('sha256', $customer->MatKhau),
                    (string) ($payload['password_fingerprint'] ?? '')
                );
        } catch (\Throwable) {
            return false;
        }
    }
}

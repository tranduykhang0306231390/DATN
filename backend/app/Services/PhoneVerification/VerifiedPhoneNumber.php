<?php

namespace App\Services\PhoneVerification;

/**
 * Kết quả xác minh: số điện thoại (dạng E.164, ví dụ +84356522518) mà
 * nhà cung cấp xác thực (Firebase) đã xác nhận người gọi thực sự sở hữu,
 * cùng định danh người dùng phía nhà cung cấp (Firebase UID).
 */
final class VerifiedPhoneNumber
{
    public function __construct(
        public readonly string $phoneNumberE164,
        public readonly string $providerUid,
    ) {}
}

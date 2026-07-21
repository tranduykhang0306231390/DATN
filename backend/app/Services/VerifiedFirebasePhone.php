<?php

namespace App\Services;

/**
 * Kết quả xác minh Firebase đã được quy đổi sang định dạng của ứng dụng:
 * số điện thoại ở định dạng lưu trữ "0xxxxxxxxx" (không phải E.164).
 */
final class VerifiedFirebasePhone
{
    public function __construct(
        public readonly string $phoneInStorageFormat,
        public readonly string $firebaseUid,
    ) {}
}

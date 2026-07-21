<?php

namespace App\Exceptions;

use Exception;

/**
 * Mọi lý do khiến việc xác minh số điện thoại qua Firebase thất bại.
 * Controller dùng $reason để chọn thông báo tiếng Việt phù hợp, không
 * bao giờ hiển thị message() (chi tiết kỹ thuật) thẳng cho người dùng.
 */
class PhoneVerificationException extends Exception
{
    public const INVALID_TOKEN = 'invalid_token';
    public const EXPIRED_TOKEN = 'expired_token';
    public const WRONG_PROJECT = 'wrong_project';
    public const MISSING_PHONE_NUMBER = 'missing_phone_number';
    public const ACCOUNT_DISABLED_OR_REVOKED = 'account_disabled_or_revoked';
    public const PHONE_MISMATCH = 'phone_mismatch';

    private function __construct(
        public readonly string $reason,
        string $message,
    ) {
        parent::__construct($message);
    }

    public static function invalidToken(string $technicalMessage): self
    {
        return new self(self::INVALID_TOKEN, "Firebase ID token không hợp lệ: {$technicalMessage}");
    }

    public static function expiredToken(): self
    {
        return new self(self::EXPIRED_TOKEN, 'Firebase ID token đã hết hạn.');
    }

    public static function wrongProject(): self
    {
        return new self(self::WRONG_PROJECT, 'Firebase ID token không thuộc đúng Firebase Project đã cấu hình.');
    }

    public static function missingPhoneNumber(): self
    {
        return new self(self::MISSING_PHONE_NUMBER, 'Firebase ID token không chứa số điện thoại đã xác minh.');
    }

    public static function accountDisabledOrRevoked(): self
    {
        return new self(
            self::ACCOUNT_DISABLED_OR_REVOKED,
            'Phiên xác thực Firebase đã bị thu hồi hoặc tài khoản Firebase đã bị vô hiệu hóa.'
        );
    }

    public static function phoneMismatch(): self
    {
        return new self(
            self::PHONE_MISMATCH,
            'Số điện thoại trong Firebase ID token không khớp với số điện thoại đang thao tác.'
        );
    }
}

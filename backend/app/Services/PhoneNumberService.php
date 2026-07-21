<?php

namespace App\Services;

/**
 * Chuẩn hóa / kiểm tra số điện thoại Việt Nam ở một nơi duy nhất.
 *
 * Định dạng lưu trong database (và mọi nơi khác trong ứng dụng đã dùng
 * từ trước, ví dụ regex '^0[0-9]{9}$' trong AuthController/Admin\KhachHangController)
 * là "0xxxxxxxxx" (10 chữ số, bắt đầu bằng 0). Service này chỉ đưa số
 * điện thoại nhập vào (0xxxxxxxxx hoặc +84xxxxxxxxx) về đúng định dạng
 * đó, và chỉ chuyển sang E.164 (+84xxxxxxxxx) khi cần gọi Firebase.
 */
class PhoneNumberService
{
    public const STORAGE_FORMAT_REGEX = '/^0\d{9}$/';

    /**
     * Chuẩn hóa số điện thoại về định dạng lưu trữ "0xxxxxxxxx".
     * Trả về null nếu không thể chuẩn hóa thành một số hợp lệ.
     */
    public function normalize(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        $trimmed = trim($input);
        // Bỏ khoảng trắng, dấu chấm, dấu gạch ngang thường gặp khi người dùng gõ tay.
        $digitsOnly = preg_replace('/[\s.\-()]/', '', $trimmed) ?? '';

        if ($digitsOnly === '') {
            return null;
        }

        if (str_starts_with($digitsOnly, '+84')) {
            $rest = substr($digitsOnly, 3);
        } elseif (str_starts_with($digitsOnly, '84') && strlen($digitsOnly) === 11) {
            $rest = substr($digitsOnly, 2);
        } elseif (str_starts_with($digitsOnly, '0')) {
            $rest = substr($digitsOnly, 1);
        } else {
            return null;
        }

        if (!preg_match('/^\d{9}$/', $rest)) {
            return null;
        }

        $candidate = '0' . $rest;

        return $this->isValid($candidate) ? $candidate : null;
    }

    /**
     * Kiểm tra một chuỗi đã ở đúng định dạng lưu trữ "0xxxxxxxxx" chưa.
     */
    public function isValid(string $phoneInStorageFormat): bool
    {
        return (bool) preg_match(self::STORAGE_FORMAT_REGEX, $phoneInStorageFormat);
    }

    /**
     * Chuyển số điện thoại (định dạng lưu trữ "0xxxxxxxxx") sang E.164
     * ("+84xxxxxxxxx") để gọi Firebase hoặc bất kỳ dịch vụ SMS nào khác.
     */
    public function toE164(string $phoneInStorageFormat): ?string
    {
        if (!$this->isValid($phoneInStorageFormat)) {
            return null;
        }

        return '+84' . substr($phoneInStorageFormat, 1);
    }

    /**
     * So sánh hai số điện thoại sau khi đã chuẩn hóa cả hai (chấp nhận
     * các cách viết khác nhau của cùng một số).
     */
    public function equals(?string $a, ?string $b): bool
    {
        $normalizedA = $this->normalize($a);
        $normalizedB = $this->normalize($b);

        return $normalizedA !== null && $normalizedA === $normalizedB;
    }
}

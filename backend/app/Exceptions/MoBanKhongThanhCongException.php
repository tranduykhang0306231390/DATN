<?php

namespace App\Exceptions;

/**
 * Lỗi nghiệp vụ khi mở bàn không thành công (bàn không khả dụng, vé không
 * hợp lệ...). Khác với lỗi hệ thống — controller bắt riêng để trả đúng mã
 * HTTP và thông điệp thay vì rơi vào nhánh 500 chung.
 */
class MoBanKhongThanhCongException extends \RuntimeException
{
    public function __construct(string $message, public readonly int $status = 422)
    {
        parent::__construct($message);
    }
}

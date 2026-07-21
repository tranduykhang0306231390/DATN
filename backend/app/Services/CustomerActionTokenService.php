<?php

namespace App\Services;

use App\Models\KhachHang;
use Illuminate\Support\Facades\DB;

/**
 * Token nội bộ, ngắn hạn, dùng một lần, cấp SAU KHI Firebase đã xác minh
 * quyền sở hữu số điện thoại — dùng cho bước 2 của "quên mật khẩu" (đặt
 * mật khẩu mới) và "đổi mật khẩu" (xác nhận mật khẩu mới).
 *
 * Thay thế App\Services\PasswordResetTokenService (cũ): trước đây token
 * hoàn toàn stateless (chỉ ký bằng Crypt, không có bản ghi trong DB) nên
 * không thể đánh dấu "đã dùng" thật sự. Giờ được lưu trong bảng
 * customer_action_tokens (chỉ lưu hash của token) để enforce single-use
 * và có thể thu hồi.
 */
class CustomerActionTokenService
{
    public const TTL_MINUTES = 10;

    public const PURPOSE_FORGOT_PASSWORD = 'forgot_password';
    public const PURPOSE_CHANGE_PASSWORD = 'change_password';

    /**
     * Cấp một token mới cho $purpose, đồng thời vô hiệu hóa mọi token
     * cùng khách hàng + cùng purpose đang còn hiệu lực trước đó.
     *
     * Trả về token GỐC (dạng chuỗi) để backend trả cho client; chỉ hash
     * của nó được lưu trong database.
     */
    public function create(KhachHang $customer, string $purpose): string
    {
        $rawToken = bin2hex(random_bytes(32));

        DB::transaction(function () use ($customer, $purpose, $rawToken) {
            DB::table('customer_action_tokens')
                ->where('ma_khach_hang', $customer->MaKhachHang)
                ->where('purpose', $purpose)
                ->whereNull('used_at')
                ->update(['used_at' => now(), 'updated_at' => now()]);

            DB::table('customer_action_tokens')->insert([
                'ma_khach_hang' => $customer->MaKhachHang,
                'purpose' => $purpose,
                'token_hash' => $this->hash($rawToken),
                'expires_at' => now()->addMinutes(self::TTL_MINUTES),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return $rawToken;
    }

    /**
     * Kiểm tra token có hợp lệ (đúng khách hàng, đúng purpose, chưa hết
     * hạn, chưa được dùng) hay không — KHÔNG đánh dấu đã dùng. Dùng khi
     * cần xác thực trước khi thực hiện thêm bước khác (ví dụ validate
     * mật khẩu mới trước khi thật sự tiêu token).
     */
    public function isValid(string $rawToken, KhachHang $customer, string $purpose): bool
    {
        return $this->findValidRecord($rawToken, $customer, $purpose) !== null;
    }

    /**
     * Xác thực VÀ tiêu token (đánh dấu used_at) trong một transaction có
     * khóa dòng, tránh race condition khi cùng một token bị dùng hai lần
     * đồng thời. Trả về false nếu token không hợp lệ.
     */
    public function consume(string $rawToken, KhachHang $customer, string $purpose): bool
    {
        return DB::transaction(function () use ($rawToken, $customer, $purpose) {
            $record = DB::table('customer_action_tokens')
                ->where('ma_khach_hang', $customer->MaKhachHang)
                ->where('purpose', $purpose)
                ->where('token_hash', $this->hash($rawToken))
                ->whereNull('used_at')
                ->where('expires_at', '>=', now())
                ->lockForUpdate()
                ->first();

            if (!$record) {
                return false;
            }

            DB::table('customer_action_tokens')
                ->where('id', $record->id)
                ->update(['used_at' => now(), 'updated_at' => now()]);

            return true;
        });
    }

    private function findValidRecord(string $rawToken, KhachHang $customer, string $purpose): ?object
    {
        return DB::table('customer_action_tokens')
            ->where('ma_khach_hang', $customer->MaKhachHang)
            ->where('purpose', $purpose)
            ->where('token_hash', $this->hash($rawToken))
            ->whereNull('used_at')
            ->where('expires_at', '>=', now())
            ->first();
    }

    private function hash(string $rawToken): string
    {
        // HMAC (khóa bằng APP_KEY) thay vì sha256 trần, để token_hash trong
        // DB vô dụng với kẻ tấn công nếu không biết APP_KEY.
        return hash_hmac('sha256', $rawToken, (string) config('app.key'));
    }
}

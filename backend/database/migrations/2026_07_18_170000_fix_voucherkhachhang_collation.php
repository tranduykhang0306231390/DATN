<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * voucherkhachhang được tạo với utf8mb4_unicode_ci trong khi các bảng
     * nghiệp vụ còn lại (uudai, hoadon, khachhang...) dùng utf8mb4_general_ci.
     * So sánh voucherkhachhang.MaUuDai = uudai.MaUuDai bị lỗi
     * "Illegal mix of collations" (SQLSTATE HY000 1267) khi ước tính/thanh toán.
     */
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE `voucherkhachhang` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE `voucherkhachhang` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        );
    }
};

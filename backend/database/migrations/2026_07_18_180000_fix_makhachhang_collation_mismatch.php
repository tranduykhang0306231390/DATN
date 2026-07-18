<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * khachhang.MaKhachHang (khóa chính) dùng utf8mb4_unicode_ci và mọi bảng
     * tham chiếu khác (lichsugiaodichdiem, lichsuhangthanhvien, phanhoikhachhang,
     * thongbao) đều theo đúng collation này — trừ hoadon và voucherkhachhang
     * đang là utf8mb4_general_ci. So sánh hoadon.MaKhachHang = khachhang.MaKhachHang
     * (dùng khi tìm kiếm hóa đơn theo tên/SĐT khách ở trang Quản lý hóa đơn)
     * bị lỗi "Illegal mix of collations" (SQLSTATE HY000 1267), cùng loại lỗi
     * đã gặp với voucherkhachhang/uudai.
     */
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE `hoadon` MODIFY `MaKhachHang` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL'
        );

        DB::statement(
            'ALTER TABLE `voucherkhachhang` MODIFY `MaKhachHang` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL'
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE `hoadon` MODIFY `MaKhachHang` VARCHAR(20) COLLATE utf8mb4_general_ci DEFAULT NULL'
        );

        DB::statement(
            'ALTER TABLE `voucherkhachhang` MODIFY `MaKhachHang` VARCHAR(20) COLLATE utf8mb4_general_ci NOT NULL'
        );
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Loại bỏ hoàn toàn cột Email khỏi bảng khachhang. Email không còn là
 * danh tính đăng nhập của khách hàng (đã chuyển sang số điện thoại +
 * Firebase Phone Authentication) và không còn được đọc/ghi ở bất kỳ nơi
 * nào khác trong ứng dụng — đã gỡ toàn bộ validate/tìm kiếm/hiển thị
 * liên quan ở AuthController, Admin\KhachHangController và giao diện
 * React (MemberProfile, QuanLyKhachHang) trước khi tạo migration này.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khachhang', function (Blueprint $table) {
            $table->dropColumn('Email');
        });
    }

    public function down(): void
    {
        Schema::table('khachhang', function (Blueprint $table) {
            // Khôi phục lại cấu trúc cột (không khôi phục được dữ liệu cũ).
            $table->string('Email', 100)->nullable()->after('NgayDangKy');
        });
    }
};

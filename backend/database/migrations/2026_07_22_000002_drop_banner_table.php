<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Loại bỏ hoàn toàn tính năng Banner (không còn sử dụng). Đã gỡ Model,
 * BannerController (public + admin), toàn bộ route /banner, trang quản
 * trị QuanLyBanner và bannerApi ở frontend trước khi tạo migration này.
 * Không có bảng nào khác tham chiếu khóa ngoại tới `banner`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('banner');
    }

    public function down(): void
    {
        // Không khôi phục lại dữ liệu cũ — tính năng Banner đã bị loại bỏ chủ đích.
        // Cấu trúc bên dưới chỉ khôi phục đúng schema gốc để rollback không lỗi.
        Schema::create('banner', function (Blueprint $table) {
            $table->string('MaBanner')->primary();
            $table->string('TieuDe');
            $table->string('HinhAnh');
            $table->string('Link')->nullable();
            $table->integer('ThuTu')->default(1);
            $table->boolean('TrangThai')->default(true);
        });
    }
};

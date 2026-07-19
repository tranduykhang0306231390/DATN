<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('datban', function (Blueprint $table) {

            $table->string('MaDatBan', 20)->primary();

            $table->string('MaKhachHang', 20);
            $table->foreign('MaKhachHang')->references('MaKhachHang')->on('khachhang');

            $table->string('MaBan', 20)->nullable();
            $table->foreign('MaBan')->references('MaBan')->on('banan');

            $table->string('MaNhanVienXuLy', 20)->nullable();
            $table->foreign('MaNhanVienXuLy')->references('MaNhanVien')->on('nhanvien');

            /*
             * hoadon dùng collation utf8mb4_general_ci (khác mặc định
             * utf8mb4_unicode_ci của các bảng migration mới), nên cột FK
             * trỏ tới hoadon.MaHoaDon phải khai báo đúng collation để
             * tránh lỗi FK errno 150.
             */
            $table->string('MaHoaDon', 20)->nullable()->collation('utf8mb4_general_ci');
            $table->foreign('MaHoaDon')->references('MaHoaDon')->on('hoadon');

            $table->dateTime('ThoiGianDat');
            $table->string('BuoiAn', 20);
            $table->unsignedInteger('SoLuongKhach');

            $table->string('TrangThai', 20)->default('ChoThanhToanCoc');
            $table->string('TrangThaiCoc', 20)->default('ChuaThanhToan');
            $table->decimal('SoTienCoc', 18, 2)->default(0);
            $table->string('MaGiaoDichCoc', 100)->nullable();

            $table->text('GhiChu')->nullable();
            $table->text('LyDoTuChoiHuy')->nullable();

            $table->dateTime('ThoiGianTao')->nullable();
            $table->dateTime('ThoiGianXacNhan')->nullable();
            $table->dateTime('ThoiGianCheckIn')->nullable();
            $table->dateTime('ThoiGianHuy')->nullable();

            $table->index(['ThoiGianDat', 'BuoiAn']);
            $table->index('TrangThai');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('datban');
    }
};

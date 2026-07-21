<?php

namespace Tests\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tạo tối thiểu các bảng cần thiết để test luồng xác thực khách hàng,
 * theo đúng cách tests/Unit/SequentialCodeServiceTest.php đã làm: các
 * bảng nghiệp vụ (khachhang, nhanvien, hangthanhvien...) đến từ
 * database/database.sql (không phải migration Laravel) nên KHÔNG tồn
 * tại trong DB sqlite :memory: dùng cho test — phải tự tạo bản tối
 * giản đúng những cột code thực sự dùng tới.
 */
trait InteractsWithCustomerAuthSchema
{
    protected function setUpCustomerAuthSchema(): void
    {
        Schema::create('hangthanhvien', function (Blueprint $table) {
            $table->string('MaHangThanhVien', 20)->primary();
            $table->string('TenHang', 100);
            $table->integer('ThuTuHang')->default(0);
            $table->integer('DiemToiThieu')->default(0);
        });

        Schema::create('khachhang', function (Blueprint $table) {
            $table->string('MaKhachHang', 20)->primary();
            $table->string('HoTen', 100);
            $table->date('NgaySinh')->nullable();
            $table->string('GioiTinh', 10)->nullable();
            $table->string('SoDienThoai', 15)->unique();
            $table->string('MatKhau', 255);
            $table->string('TrangThai', 20)->default('HoatDong');
            $table->string('MaHangThanhVien', 20);
            $table->integer('TongDiem')->default(0);
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('firebase_uid', 128)->nullable();
            $table->string('created_by_employee_id', 20)->nullable();
        });

        Schema::create('nhanvien', function (Blueprint $table) {
            $table->string('MaNhanVien', 20)->primary();
            $table->string('HoTen', 100);
            $table->string('TenDangNhap', 50)->unique();
            $table->string('MatKhau', 255);
            $table->string('VaiTro', 20);
            $table->string('TrangThai', 20)->default('HoatDong');
        });

        Schema::create('customer_action_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('ma_khach_hang', 20);
            $table->string('purpose', 40);
            $table->string('token_hash', 64);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDownCustomerAuthSchema(): void
    {
        Schema::dropIfExists('customer_action_tokens');
        Schema::dropIfExists('nhanvien');
        Schema::dropIfExists('khachhang');
        Schema::dropIfExists('hangthanhvien');
    }
}

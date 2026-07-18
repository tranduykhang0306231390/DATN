<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chặn race condition: 2 hóa đơn "ChuaThanhToan" không được trùng SoBan.
 * Dùng cột generated (chỉ có giá trị khi TrangThai = 'ChuaThanhToan') + unique
 * index trên cột đó, vì MySQL/MariaDB không hỗ trợ partial unique index trực
 * tiếp — NULL không bị tính trùng nên các hóa đơn đã thanh toán/đã hủy không
 * bị ràng buộc.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {
            $table->string('SoBanDangMo', 20)
                ->virtualAs("CASE WHEN TrangThai = 'ChuaThanhToan' THEN SoBan ELSE NULL END")
                ->nullable()
                ->after('SoBan');
        });

        Schema::table('hoadon', function (Blueprint $table) {
            $table->unique('SoBanDangMo', 'hoadon_soban_dangmo_unique');
        });
    }

    public function down(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {
            $table->dropUnique('hoadon_soban_dangmo_unique');
            $table->dropColumn('SoBanDangMo');
        });
    }
};

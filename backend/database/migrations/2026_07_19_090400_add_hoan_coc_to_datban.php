<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('datban', function (Blueprint $table) {

            $table->string('NganHangHoanTien', 100)->nullable()->after('MaGiaoDichCoc');
            $table->string('SoTaiKhoanHoanTien', 50)->nullable()->after('NganHangHoanTien');
            $table->string('TenChuTaiKhoanHoanTien', 100)->nullable()->after('SoTaiKhoanHoanTien');
            $table->decimal('SoTienHoan', 18, 2)->nullable()->after('TenChuTaiKhoanHoanTien');

            /*
             * KhongApDung, ChoXuLy, DaHoanTien, DaTruVaoHoaDon.
             */
            $table->string('TrangThaiHoanTien', 20)->default('KhongApDung')->after('SoTienHoan');

            $table->string('MaNhanVienXuLyHoanTien', 20)->nullable()->after('TrangThaiHoanTien');
            $table->foreign('MaNhanVienXuLyHoanTien')->references('MaNhanVien')->on('nhanvien');

            $table->dateTime('ThoiGianHoanTien')->nullable()->after('MaNhanVienXuLyHoanTien');

        });
    }

    public function down(): void
    {
        Schema::table('datban', function (Blueprint $table) {

            $table->dropForeign(['MaNhanVienXuLyHoanTien']);

            $table->dropColumn([
                'NganHangHoanTien',
                'SoTaiKhoanHoanTien',
                'TenChuTaiKhoanHoanTien',
                'SoTienHoan',
                'TrangThaiHoanTien',
                'MaNhanVienXuLyHoanTien',
                'ThoiGianHoanTien',
            ]);

        });
    }
};

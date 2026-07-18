<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ghi lại lý do + ai + lúc nào hủy hóa đơn ĐÃ THANH TOÁN (kèm hoàn điểm/voucher).
 * Trước đây tham số ly_do chỉ được validate rồi bỏ qua, không lưu lại đâu cả.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {
            $table->string('LyDoHuy', 255)->nullable()->after('MaVoucher');
            $table->dateTime('ThoiGianHuy')->nullable()->after('LyDoHuy');

            // Cột mới trên bảng hoadon mặc định thừa collation của bảng
            // (utf8mb4_general_ci) trong khi nhanvien.MaNhanVien lại là
            // utf8mb4_unicode_ci — phải ép khớp thì FK mới tạo được (đã
            // tái hiện lỗi errno 150 thật khi thử không ép).
            $table->string('MaNhanVienHuy', 20)->nullable()->after('ThoiGianHuy')
                ->collation('utf8mb4_unicode_ci');

            $table->foreign('MaNhanVienHuy')->references('MaNhanVien')->on('nhanvien');
        });
    }

    public function down(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {
            $table->dropForeign(['MaNhanVienHuy']);
            $table->dropColumn(['LyDoHuy', 'ThoiGianHuy', 'MaNhanVienHuy']);
        });
    }
};

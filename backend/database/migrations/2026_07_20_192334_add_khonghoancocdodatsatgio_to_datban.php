<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('datban', function (Blueprint $table) {
            /*
             * Chốt ngay lúc tạo: nếu thời gian đặt trước thực tế (từ lúc
             * tạo tới giờ hẹn) ngắn hơn mốc "Hủy hoàn một phần trước"
             * (CauHinhDatBan.SoGioHuyMotPhan), lượt đặt này sẽ KHÔNG BAO
             * GIỜ được hoàn cọc khi hủy — vì không đủ khoảng thời gian để
             * đạt bất kỳ bậc hoàn nào trong chính sách 3 bậc hiện có (mất
             * hết ý nghĩa khi Đặt trước tối thiểu được cấu hình dưới mốc
             * này, ví dụ 30-45 phút). Lưu cứng tại thời điểm đặt để không
             * bị ảnh hưởng nếu admin đổi cấu hình sau đó.
             */
            $table->boolean('KhongHoanCocDoDatSatGio')->default(false)->after('TrangThaiCoc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('datban', function (Blueprint $table) {
            $table->dropColumn('KhongHoanCocDoDatSatGio');
        });
    }
};

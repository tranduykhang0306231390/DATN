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
        Schema::table('cauhinhdatban', function (Blueprint $table) {
            /*
             * Mỗi lượt đặt bàn coi như chiếm 1 bàn trong khoảng
             * [ThoiGianDat, ThoiGianDat + ThoiLuongPhucVuPhut] — dùng để
             * tính số bàn còn trống tại một thời điểm cụ thể thay vì gán
             * cứng khung giờ Trưa/Tối như trước.
             */
            $table->unsignedInteger('ThoiLuongPhucVuPhut')
                ->default(120)
                ->after('SoGioDatToiThieu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cauhinhdatban', function (Blueprint $table) {
            $table->dropColumn('ThoiLuongPhucVuPhut');
        });
    }
};

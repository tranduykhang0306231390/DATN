<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Đổi "Đặt trước tối thiểu" từ đơn vị GIỜ (số nguyên) sang PHÚT, để admin
 * cấu hình được các mức lẻ (15 phút, 30 phút...) thay vì chỉ nguyên giờ —
 * hữu ích khi cửa hàng vắng khách và muốn rút ngắn thời gian đặt trước.
 * Dùng SQL thuần vì doctrine/dbal (cần cho Schema::renameColumn) chưa được
 * cài trong project.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE cauhinhdatban CHANGE SoGioDatToiThieu SoPhutDatToiThieu '
            . 'INT UNSIGNED NOT NULL DEFAULT 120'
        );

        DB::statement('UPDATE cauhinhdatban SET SoPhutDatToiThieu = SoPhutDatToiThieu * 60');
    }

    public function down(): void
    {
        DB::statement('UPDATE cauhinhdatban SET SoPhutDatToiThieu = SoPhutDatToiThieu DIV 60');

        DB::statement(
            'ALTER TABLE cauhinhdatban CHANGE SoPhutDatToiThieu SoGioDatToiThieu '
            . 'INT UNSIGNED NOT NULL DEFAULT 2'
        );
    }
};

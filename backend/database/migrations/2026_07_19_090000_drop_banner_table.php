<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bỏ toàn bộ chức năng quản lý banner — không còn controller/route/trang
     * admin nào sử dụng bảng này.
     */
    public function up(): void
    {
        Schema::dropIfExists('banner');
    }

    public function down(): void
    {
        Schema::create('banner', function (Blueprint $table) {
            $table->string('MaBanner', 20)->primary();
            $table->string('TieuDe', 255);
            $table->string('HinhAnh', 255);
            $table->string('Link', 255)->nullable();
            $table->integer('ThuTu');
            $table->tinyInteger('TrangThai')->default(1);
        });
    }
};

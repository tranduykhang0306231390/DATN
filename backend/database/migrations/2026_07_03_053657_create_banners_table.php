<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banner', function (Blueprint $table) {

            $table->string('MaBanner')->primary();

            $table->string('TieuDe');

            $table->string('HinhAnh');

            $table->string('Link')->nullable();

            $table->integer('ThuTu')->default(1);

            $table->boolean('TrangThai')->default(true);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banner');
    }
};
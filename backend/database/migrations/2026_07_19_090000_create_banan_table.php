<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banan', function (Blueprint $table) {

            $table->string('MaBan', 20)->primary();

            $table->string('TenBan', 50);

            $table->string('KhuVuc', 50);

            $table->unsignedInteger('SucChua');

            $table->string('TrangThai', 20)->default('HoatDong');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banan');
    }
};

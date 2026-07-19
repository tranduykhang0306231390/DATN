<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cauhinhdatban', function (Blueprint $table) {

            $table->id('MaCauHinh');

            $table->unsignedInteger('ThoiGianGiuChoPhut')->default(10);

            $table->unsignedInteger('SoGioDatToiThieu')->default(2);

            $table->unsignedInteger('SoKhachToiThieu')->default(2);

            $table->unsignedInteger('SoKhachToiDa')->default(20);

            $table->unsignedInteger('PhutGiuBanSauGioHen')->default(15);

            $table->decimal('MucCocMoiKhach', 18, 2)->default(50000);

            $table->unsignedInteger('SoGioHuyMienPhi')->default(6);

            $table->unsignedInteger('SoGioHuyMotPhan')->default(2);

            $table->unsignedInteger('PhanTramHoanMotPhan')->default(50);

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cauhinhdatban');
    }
};

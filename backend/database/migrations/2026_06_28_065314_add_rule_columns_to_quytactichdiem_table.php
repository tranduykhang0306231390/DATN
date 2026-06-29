<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quytactichdiem', function (Blueprint $table) {

            $table->decimal('GiaTriHoaDonToiThieu',12,2)->default(0);

            $table->integer('DiemThuong')->default(0);

            $table->decimal('HeSoNhanDiem',3,2)->default(1.00);

            $table->boolean('NhanDoiSinhNhat')->default(false);

        });
    }

    public function down(): void
    {
        Schema::table('quytactichdiem', function (Blueprint $table) {

            $table->dropColumn([
                'GiaTriHoaDonToiThieu',
                'DiemThuong',
                'HeSoNhanDiem',
                'NhanDoiSinhNhat'
            ]);

        });
    }
};
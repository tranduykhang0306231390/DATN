<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loaive', function (Blueprint $table) {

            $table->string('HinhAnh')->nullable();

            $table->text('MoTa')->nullable();

        });
    }

    public function down(): void
    {
        Schema::table('loaive', function (Blueprint $table) {

            $table->dropColumn('HinhAnh');

            $table->dropColumn('MoTa');

        });
    }
};
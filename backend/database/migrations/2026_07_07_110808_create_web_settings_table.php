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
        Schema::create('web_settings', function (Blueprint $table) {

            $table->id('MaWebSetting');

            $table->string('TenWebsite',150);

            $table->string('Logo')->nullable();

            $table->string('DiaChi',255);

            $table->string('EmailLienHe',150);

            $table->string('SoDienThoai',20);

            $table->longText('NoiDungWebsite')->nullable();

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_settings');
    }
};
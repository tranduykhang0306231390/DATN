<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {

            /*
             * hoadon dùng collation utf8mb4_general_ci nhưng datban (bảng
             * migration mới) mặc định utf8mb4_unicode_ci — phải khai báo
             * đúng collation của datban ở đây để FK không lỗi errno 150.
             */
            $table->string('MaDatBan', 20)
                ->nullable()
                ->after('SoBan')
                ->collation('utf8mb4_unicode_ci');

            $table->foreign('MaDatBan')->references('MaDatBan')->on('datban');

        });
    }

    public function down(): void
    {
        Schema::table('hoadon', function (Blueprint $table) {
            $table->dropForeign(['MaDatBan']);
            $table->dropColumn('MaDatBan');
        });
    }
};

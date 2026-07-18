<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uudai', function (Blueprint $table) {
            if (!Schema::hasColumn('uudai', 'GiaTriHoaDonToiThieu')) {
                // Mặc định 0 = không yêu cầu tối thiểu, giữ nguyên hành vi
                // của các ưu đãi đã tạo trước đó.
                $table->decimal('GiaTriHoaDonToiThieu', 18, 2)
                    ->default(0)
                    ->after('GiaTriGiam');
            }
        });
 
        // Gợi ý mức tối thiểu hợp lý cho các ưu đãi giảm tiền đã có:
        // hóa đơn phải gấp đôi giá trị giảm thì voucher mới dùng được.
        // Bỏ dòng này nếu muốn tự đặt tay từng ưu đãi.
        DB::table('uudai')
            ->where('NhomUuDai', 'GiamTien')
            ->where('GiaTriHoaDonToiThieu', 0)
            ->update([
                'GiaTriHoaDonToiThieu' => DB::raw('GiaTriGiam * 2'),
            ]);
    }
 
    public function down(): void
    {
        Schema::table('uudai', function (Blueprint $table) {
            if (Schema::hasColumn('uudai', 'GiaTriHoaDonToiThieu')) {
                $table->dropColumn('GiaTriHoaDonToiThieu');
            }
        });
    }
};

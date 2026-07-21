<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Số điện thoại trở thành tài khoản đăng nhập của khách hàng nên phải
 * là duy nhất ở tầng database, không chỉ validate ở tầng ứng dụng.
 *
 * An toàn dữ liệu: trước khi thêm unique index, kiểm tra xem có số
 * điện thoại nào bị trùng lặp hoặc rỗng hay không. Nếu có, migration
 * sẽ dừng lại và liệt kê rõ các số bị trùng thay vì để ALTER TABLE
 * thất bại với một lỗi SQL khó hiểu, hoặc tệ hơn là âm thầm xóa/gộp
 * dữ liệu khách hàng.
 */
return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('khachhang')
            ->select('SoDienThoai', DB::raw('COUNT(*) as so_luong'))
            ->whereNotNull('SoDienThoai')
            ->where('SoDienThoai', '!=', '')
            ->groupBy('SoDienThoai')
            ->having(DB::raw('COUNT(*)'), '>', 1)
            ->get();

        if ($duplicates->isNotEmpty()) {
            $danhSach = $duplicates
                ->map(fn ($row) => "{$row->SoDienThoai} ({$row->so_luong} khách hàng)")
                ->implode(', ');

            throw new \RuntimeException(
                'Không thể thêm unique index cho SoDienThoai vì dữ liệu hiện tại có số điện thoại '
                . "trùng lặp: {$danhSach}. Vui lòng xử lý thủ công (không tự động gộp/xóa) rồi chạy "
                . 'lại migration này.'
            );
        }

        $rongHoacNull = DB::table('khachhang')
            ->where(function ($query) {
                $query->whereNull('SoDienThoai')->orWhere('SoDienThoai', '');
            })
            ->count();

        if ($rongHoacNull > 0) {
            throw new \RuntimeException(
                "Không thể thêm unique index cho SoDienThoai vì có {$rongHoacNull} khách hàng chưa có "
                . 'số điện thoại. Vui lòng bổ sung số điện thoại thủ công rồi chạy lại migration này.'
            );
        }

        Schema::table('khachhang', function (Blueprint $table) {
            $table->unique('SoDienThoai');
        });
    }

    public function down(): void
    {
        Schema::table('khachhang', function (Blueprint $table) {
            $table->dropUnique(['SoDienThoai']);
        });
    }
};

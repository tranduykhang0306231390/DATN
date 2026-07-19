<?php

namespace App\Services;

use App\Models\ThongBao;

/**
 * Tạo thông báo cho khách hàng.
 *
 * Tách ra từ DiemTichLuyService để dùng chung cho các luồng khác
 * (đặt bàn, xử lý quá hạn...) mà không phụ thuộc vào logic tích điểm.
 */
class ThongBaoService
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    public function gui(string $maKH, string $tieuDe, string $noiDung): void
    {
        ThongBao::create([
            'MaThongBao'  => $this->codes->next('thongbao', 'MaThongBao', 'TB'),
            'TieuDe'      => $tieuDe,
            'NoiDung'     => $noiDung,
            'ThoiGian'    => now(),
            'TrangThai'   => 'ChuaDoc',
            'MaKhachHang' => $maKH,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;

class MemberRankController extends Controller
{
    /**
     * Cấu hình hạng dành cho giao diện khách hàng.
     *
     * Endpoint chỉ đọc dữ liệu hiện có, không thực hiện tính điểm hoặc
     * cập nhật hạng ở phía client.
     */
    public function index()
    {
        $ranks = HangThanhVien::query()
            ->select([
                'MaHangThanhVien',
                'TenHang',
                'MoTa',
                'TongChiTieuToiThieu',
                'DiemToiThieu',
                'ThuTuHang',
                'MaQuyTac',
            ])
            ->with([
                'quyTac' => function ($query) {
                    $query->select([
                        'MaQuyTac',
                        'SoTienQuyDoi',
                        'SoDiemNhan',
                        'NgayApDung',
                        'NgayHetHan',
                        'TrangThai',
                        'GiaTriHoaDonToiThieu',
                        'HeSoNhanDiem',
                        'NhanDoiSinhNhat',
                    ]);
                },
            ])
            ->orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ranks,
        ]);
    }
}

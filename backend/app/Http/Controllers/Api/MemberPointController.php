<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\LichSuGiaoDichDiem;

class MemberPointController extends Controller
{
    public function index()
    {
        $user = auth('khachhang')->user();

        $paidInvoices = HoaDon::query()
            ->where('MaKhachHang', $user->MaKhachHang)
            ->where('TrangThai', 'DaThanhToan');

        $tongHoaDon = (clone $paidInvoices)->count();
        $tongChiTieu = (clone $paidInvoices)->sum('TongTien');

        $pointTotals = LichSuGiaoDichDiem::query()
            ->where('MaKhachHang', $user->MaKhachHang)
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN SoDiemSau > SoDiemTruoc THEN SoDiemSau - SoDiemTruoc ELSE 0 END), 0) AS TongDiemNhan'
            )
            ->selectRaw(
                /*
                 * Chỉ tính điểm khách CHỦ ĐỘNG dùng (đổi voucher).
                 * Không gộp điểm bị hệ thống thu hồi do hủy hóa đơn
                 * (HoanDiemHuyHD) — đó không phải khách "sử dụng" điểm.
                 */
                "COALESCE(SUM(CASE WHEN LoaiGiaoDich = 'DoiVoucher' AND SoDiemSau < SoDiemTruoc THEN SoDiemTruoc - SoDiemSau ELSE 0 END), 0) AS TongDiemDaDung"
            )
            ->first();

        $tongDiemNhan = (int) ($pointTotals?->TongDiemNhan ?? 0);
        $tongDiemDaDung = (int) ($pointTotals?->TongDiemDaDung ?? 0);

        return response()->json([

            "TongDiem" => $user->TongDiem,

            "HangThanhVien" => $user->MaHangThanhVien,

            "TongHoaDon" => $tongHoaDon,

            "TongChiTieu" => $tongChiTieu,

            "TongDiemNhan" => $tongDiemNhan,

            "TongDiemDaDung" => $tongDiemDaDung

        ]);
    }
}

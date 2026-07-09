<?php
// app/Http/Controllers/Api/Admin/ThongKeController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThongKeController extends Controller
{
    /**
     * Số liệu tổng quan (dùng cho dashboard).
     */
    public function tongQuan()
    {
        $today = now()->toDateString();

        $doanhThuHomNay = (float) DB::table('hoadon')
            ->whereDate('NgayLap', $today)
            ->where('TrangThai', 'DaThanhToan')
            ->sum('TongTien');

        $hoaDonHomNay = (int) DB::table('hoadon')
            ->whereDate('NgayLap', $today)
            ->where('TrangThai', 'DaThanhToan')
            ->count();

        $tongKhachHang = (int) DB::table('khachhang')
            ->where('TrangThai', 'HoatDong')
            ->count();

        $uuDaiDangChay = (int) DB::table('uudai')
            ->where('TrangThai', 'HoatDong')
            ->whereDate('NgayBatDau', '<=', $today)
            ->whereDate('NgayKetThuc', '>=', $today)
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'doanhThuHomNay' => $doanhThuHomNay,
                'hoaDonHomNay'   => $hoaDonHomNay,
                'tongKhachHang'  => $tongKhachHang,
                'uuDaiDangChay'  => $uuDaiDangChay,
            ],
        ]);
    }

    /**
     * Thống kê chi tiết theo khoảng thời gian.
     * params: tu_ngay, den_ngay (Y-m-d). Mặc định 30 ngày gần nhất.
     */
    public function chiTiet(Request $request)
    {
        $denNgay = $request->query('den_ngay') ?: now()->toDateString();
        $tuNgay  = $request->query('tu_ngay') ?: now()->subDays(29)->toDateString();

        // ── Tổng hợp trong khoảng ──────────────────────────────────
        $hoaDonQuery = DB::table('hoadon')
            ->whereDate('NgayLap', '>=', $tuNgay)
            ->whereDate('NgayLap', '<=', $denNgay);

        $tongDoanhThu = (float) (clone $hoaDonQuery)
            ->where('TrangThai', 'DaThanhToan')->sum('TongTien');

        $soHoaDon = (int) (clone $hoaDonQuery)
            ->where('TrangThai', 'DaThanhToan')->count();

        $soHoaDonHuy = (int) (clone $hoaDonQuery)
            ->where('TrangThai', 'DaHuy')->count();

        $tongDiemPhat = (int) (clone $hoaDonQuery)
            ->where('TrangThai', 'DaThanhToan')->sum('DiemTichLuy');

        $trungBinhHoaDon = $soHoaDon > 0 ? $tongDoanhThu / $soHoaDon : 0;

        // ── Doanh thu theo ngày ────────────────────────────────────
        $theoNgay = DB::table('hoadon')
            ->selectRaw('DATE(NgayLap) as ngay, SUM(TongTien) as doanh_thu, COUNT(*) as so_hoa_don')
            ->where('TrangThai', 'DaThanhToan')
            ->whereDate('NgayLap', '>=', $tuNgay)
            ->whereDate('NgayLap', '<=', $denNgay)
            ->groupByRaw('DATE(NgayLap)')
            ->orderBy('ngay')
            ->get();

        // ── Top loại vé bán chạy ───────────────────────────────────
        $topLoaiVe = DB::table('chitiethoadon as ct')
            ->join('hoadon as hd', 'ct.MaHoaDon', '=', 'hd.MaHoaDon')
            ->join('loaive as lv', 'ct.MaLoaiVe', '=', 'lv.MaLoaiVe')
            ->selectRaw('lv.MaLoaiVe, lv.TenLoaiVe, SUM(ct.SoLuong) as so_luong, SUM(ct.SoLuong * ct.DonGia) as doanh_thu')
            ->where('hd.TrangThai', 'DaThanhToan')
            ->whereDate('hd.NgayLap', '>=', $tuNgay)
            ->whereDate('hd.NgayLap', '<=', $denNgay)
            ->groupBy('lv.MaLoaiVe', 'lv.TenLoaiVe')
            ->orderByDesc('so_luong')
            ->limit(5)
            ->get();

        // ── Phân bố khách theo hạng ────────────────────────────────
        $phanBoHang = DB::table('khachhang as kh')
            ->join('hangthanhvien as htv', 'kh.MaHangThanhVien', '=', 'htv.MaHangThanhVien')
            ->selectRaw('htv.TenHang, htv.ThuTuHang, COUNT(*) as so_khach')
            ->where('kh.TrangThai', 'HoatDong')
            ->groupBy('htv.TenHang', 'htv.ThuTuHang')
            ->orderBy('htv.ThuTuHang')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'khoang_thoi_gian' => ['tu_ngay' => $tuNgay, 'den_ngay' => $denNgay],
                'tong_hop' => [
                    'tong_doanh_thu'     => $tongDoanhThu,
                    'so_hoa_don'         => $soHoaDon,
                    'so_hoa_don_huy'     => $soHoaDonHuy,
                    'trung_binh_hoa_don' => round($trungBinhHoaDon),
                    'tong_diem_phat'     => $tongDiemPhat,
                ],
                'theo_ngay'    => $theoNgay,
                'top_loai_ve'  => $topLoaiVe,
                'phan_bo_hang' => $phanBoHang,
            ],
        ]);
    }
}
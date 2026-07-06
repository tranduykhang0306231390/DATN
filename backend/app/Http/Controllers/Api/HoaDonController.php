<?php
// app/Http/Controllers/Api/HoaDonController.php
// Chỉ xử lý: tạo hóa đơn + xem chi tiết

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\KhachHang;
use App\Models\LoaiVe;
use App\Models\VoucherKhachHang;
use App\Services\DiemTichLuyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HoaDonController extends Controller
{
    public function __construct(
        private DiemTichLuyService $diemService
    ) {}

    /**
     * Tạo hóa đơn
     */
    public function store(Request $request)
    {
        $request->validate([
            'chi_tiet'             => 'required|array|min:1',
            'chi_tiet.*.MaLoaiVe' => 'required|string|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'  => 'required|integer|min:1',
            'ma_khach_hang'        => 'nullable|string|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung'     => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $nhanVien = auth('nhanvien')->user();

            // ── 1. Tính tổng tiền gốc ──────────────────────────────────
            $tongTienGoc = 0;
            $chiTietData = [];

            foreach ($request->chi_tiet as $item) {
                $loaiVe = LoaiVe::find($item['MaLoaiVe']);
                if (!$loaiVe || $loaiVe->TrangThai !== 'HoatDong') {
                    return response()->json([
                        'success' => false,
                        'message' => "Loại vé {$item['MaLoaiVe']} không khả dụng"
                    ], 422);
                }
                $tongTienGoc  += $loaiVe->GiaVe * $item['SoLuong'];
                $chiTietData[] = [
                    'loaiVe'  => $loaiVe,
                    'SoLuong' => $item['SoLuong'],
                    'DonGia'  => $loaiVe->GiaVe,
                ];
            }

            // ── 2. Xử lý voucher ──────────────────────────────────────
            $tongGiam      = 0;
            $maVoucherList = [];
            $khachHang     = null;

            if ($request->ma_khach_hang) {
                $khachHang = KhachHang::with(['hangThanhVien.quyTac'])
                    ->find($request->ma_khach_hang);

                if ($request->filled('vouchers_ap_dung')) {
                    $vouchers = VoucherKhachHang::with('uuDai')
                        ->whereIn('MaVoucherKhachHang', $request->vouchers_ap_dung)
                        ->where('MaKhachHang', $khachHang->MaKhachHang)
                        ->where('TrangThai', 'ChuaSuDung')
                        ->where('NgayHetHan', '>=', now()->format('Y-m-d'))
                        ->get()
                        ->sortBy('uuDai.ThuTuApDung');

                    $nhomDaSuDung = [];
                    foreach ($vouchers as $v) {
                        $nhom = $v->uuDai->NhomUuDai;
                        if (isset($nhomDaSuDung[$nhom]) && !$v->uuDai->CoTheDungChung) {
                            continue;
                        }
                        $tongGiam += $v->uuDai->NhomUuDai === 'PhanTram'
                            ? $tongTienGoc * ($v->uuDai->GiaTriGiam / 100)
                            : $v->uuDai->GiaTriGiam;

                        $nhomDaSuDung[$nhom]   = true;
                        $maVoucherList[]        = $v->MaVoucherKhachHang;
                    }
                }
            }

            $tongThanhToan = max(0, $tongTienGoc - $tongGiam);

            // ── 3. Sinh mã hóa đơn ────────────────────────────────────
            $lastHD = HoaDon::orderBy('MaHoaDon', 'desc')->first();
            $soHD   = $lastHD ? ((int) substr($lastHD->MaHoaDon, 2)) + 1 : 1;
            $maHD   = 'HD' . str_pad($soHD, 3, '0', STR_PAD_LEFT);

            // ── 4. Tính điểm tích lũy ─────────────────────────────────
            $diemTichLuy = 0;
            $maQuyTac    = null;
            $maHang      = null;

            if ($khachHang) {
                $quyTac = $khachHang->hangThanhVien->quyTac ?? null;
                if ($quyTac && $quyTac->TrangThai === 'HoatDong') {
                    $diemTichLuy = (int) floor($tongThanhToan / $quyTac->SoTienQuyDoi)
                                   * $quyTac->SoDiemNhan;
                    $maQuyTac    = $quyTac->MaQuyTac;
                }
                $maHang = $khachHang->MaHangThanhVien;
            }

            // ── 5. Lưu hóa đơn ────────────────────────────────────────
            HoaDon::create([
                'MaHoaDon'        => $maHD,
                'NgayLap'         => now(),
                'TongTien'        => $tongThanhToan,
                'DiemSuDung'      => 0,
                'DiemTichLuy'     => $diemTichLuy,
                'TrangThai'       => 'DaThanhToan',
                'MaNhanVien'      => $nhanVien->MaNhanVien,
                'MaKhachHang'     => $khachHang?->MaKhachHang,
                'MaQuyTacHienTai' => $maQuyTac,
                'MaHangThanhVien' => $maHang,
                'MaVoucher'       => implode(',', $maVoucherList) ?: null,
            ]);

            // ── 6. Lưu chi tiết hóa đơn ───────────────────────────────
            $lastCT = ChiTietHoaDon::orderBy('MaChiTietHD', 'desc')->first();
            $soCT   = $lastCT ? ((int) substr($lastCT->MaChiTietHD, 4)) + 1 : 1;

            foreach ($chiTietData as $ct) {
                ChiTietHoaDon::create([
                    'MaChiTietHD' => 'CTHD' . str_pad($soCT++, 3, '0', STR_PAD_LEFT),
                    'SoLuong'     => $ct['SoLuong'],
                    'DonGia'      => $ct['DonGia'],
                    'MaHoaDon'    => $maHD,
                    'MaLoaiVe'    => $ct['loaiVe']->MaLoaiVe,
                ]);
            }

            // ── 7. Cập nhật voucher đã dùng ───────────────────────────
            if (!empty($maVoucherList)) {
                VoucherKhachHang::whereIn('MaVoucherKhachHang', $maVoucherList)
                    ->update(['TrangThai' => 'DaSuDung', 'NgaySuDung' => now()->format('Y-m-d')]);
            }

            // ── 8. Tích điểm + lên hạng (delegate sang Service) ───────
            if ($khachHang && $diemTichLuy > 0) {
                $this->diemService->congDiem($khachHang, $diemTichLuy, $maHD);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo hóa đơn thành công',
                'data'    => [
                    'MaHoaDon'      => $maHD,
                    'TongTienGoc'   => $tongTienGoc,
                    'TongGiam'      => $tongGiam,
                    'TongThanhToan' => $tongThanhToan,
                    'DiemTichLuy'   => $diemTichLuy,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xem chi tiết hóa đơn
     */
    public function show(string $maHoaDon)
    {
        $hoaDon = HoaDon::with([
            'chiTietHoaDon.loaiVe',
            'khachHang.hangThanhVien',
            'nhanVien',
            'hangThanhVien',
        ])->find($maHoaDon);

        if (!$hoaDon) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $hoaDon]);
    }
}
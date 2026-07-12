<?php
// app/Http/Controllers/Api/HoaDonController.php
// Gộp: tạo/treo hóa đơn theo bàn + danh sách + chi tiết + thanh toán
// (Đã bỏ chức năng hủy)

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

    /* ==================================================================
     *  TẠO / TREO HÓA ĐƠN THEO BÀN
     *  - Lưu ở trạng thái 'ChuaThanhToan' (treo trên bàn), CHƯA tích điểm.
     *  - Điểm & voucher chỉ xử lý khi bấm Thanh toán.
     * ================================================================== */
    public function store(Request $request)
    {
        $request->validate([
            'so_ban'               => 'required|integer|min:1|max:20',
            'chi_tiet'             => 'required|array|min:1',
            'chi_tiet.*.MaLoaiVe'  => 'required|string|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'   => 'required|integer|min:1',
            'ma_khach_hang'        => 'nullable|string|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung'     => 'nullable|array',
        ]);

        // Một bàn chỉ được có 1 hóa đơn đang treo
        $daCo = HoaDon::where('SoBan', $request->so_ban)
            ->where('TrangThai', 'ChuaThanhToan')
            ->exists();
        if ($daCo) {
            return response()->json([
                'success' => false,
                'message' => "Bàn {$request->so_ban} đang có hóa đơn chưa thanh toán.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $nhanVien = auth('nhanvien')->user();

            $tongTienGoc = 0;
            $chiTietData = [];

            foreach ($request->chi_tiet as $item) {
                $loaiVe = LoaiVe::find($item['MaLoaiVe']);
                if (!$loaiVe || $loaiVe->TrangThai !== 'HoatDong') {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Loại vé {$item['MaLoaiVe']} không khả dụng",
                    ], 422);
                }
                if (!$this->veHopLeThoiDiemNay($loaiVe)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Vé \"{$loaiVe->TenLoaiVe}\" không áp dụng cho thời điểm hiện tại.",
                    ], 422);
                }
                $tongTienGoc  += $loaiVe->GiaVe * $item['SoLuong'];
                $chiTietData[] = [
                    'loaiVe'  => $loaiVe,
                    'SoLuong' => $item['SoLuong'],
                    'DonGia'  => $loaiVe->GiaVe,
                ];
            }

            $khachHang = $request->ma_khach_hang
                ? KhachHang::find($request->ma_khach_hang)
                : null;

            $lastHD = HoaDon::orderBy('MaHoaDon', 'desc')->first();
            $soHD   = $lastHD ? ((int) substr($lastHD->MaHoaDon, 2)) + 1 : 1;
            $maHD   = 'HD' . str_pad($soHD, 3, '0', STR_PAD_LEFT);

            HoaDon::create([
                'MaHoaDon'        => $maHD,
                'NgayLap'         => now(),
                'TongTien'        => $tongTienGoc,
                'DiemSuDung'      => 0,
                'DiemTichLuy'     => 0,
                'TrangThai'       => 'ChuaThanhToan',
                'MaNhanVien'      => $nhanVien->MaNhanVien,
                'MaKhachHang'     => $khachHang?->MaKhachHang,
                'MaQuyTacHienTai' => null,
                'MaHangThanhVien' => $khachHang?->MaHangThanhVien,
                'MaVoucher'       => $request->filled('vouchers_ap_dung')
                    ? implode(',', $request->vouchers_ap_dung)
                    : null,
                'SoBan'           => $request->so_ban,
            ]);

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

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Đã mở bàn {$request->so_ban}",
                'data'    => ['MaHoaDon' => $maHD, 'SoBan' => $request->so_ban],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* 
     *  THANH TOÁN HÓA ĐƠN TREO
     */
    public function thanhToan(string $maHD)
    {
        $hoaDon = HoaDon::with('chiTietHoaDon')->find($maHD);

        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Hóa đơn này đã được thanh toán hoặc không hợp lệ.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $tongTienGoc = $hoaDon->chiTietHoaDon->sum(fn ($ct) => $ct->DonGia * $ct->SoLuong);

            $khachHang = $hoaDon->MaKhachHang
                ? KhachHang::with(['hangThanhVien.quyTac'])->find($hoaDon->MaKhachHang)
                : null;

            $tongGiam      = 0;
            $maVoucherList = [];

            if ($khachHang && $hoaDon->MaVoucher) {
                $vouchers = VoucherKhachHang::with('uuDai')
                    ->whereIn('MaVoucherKhachHang', explode(',', $hoaDon->MaVoucher))
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

                    $nhomDaSuDung[$nhom] = true;
                    $maVoucherList[]     = $v->MaVoucherKhachHang;
                }
            }

            $tongThanhToan = max(0, $tongTienGoc - $tongGiam);

            $diemTichLuy = 0;
            $maQuyTac    = null;

            if ($khachHang) {
                $quyTac = $khachHang->hangThanhVien->quyTac ?? null;
                if ($quyTac && $quyTac->TrangThai === 'HoatDong') {
                    $diemTichLuy = $this->diemService->tinhDiem(
                        $quyTac,
                        (float) $tongThanhToan,
                        $khachHang->NgaySinh
                    );
                    $maQuyTac = $quyTac->MaQuyTac;
                }
            }

            $hoaDon->update([
                'TongTien'        => $tongThanhToan,
                'DiemTichLuy'     => $diemTichLuy,
                'TrangThai'       => 'DaThanhToan',
                'NgayLap'         => now(),
                'MaQuyTacHienTai' => $maQuyTac,
                'MaVoucher'       => implode(',', $maVoucherList) ?: null,
            ]);

            if (!empty($maVoucherList)) {
                VoucherKhachHang::whereIn('MaVoucherKhachHang', $maVoucherList)
                    ->update(['TrangThai' => 'DaSuDung', 'NgaySuDung' => now()->format('Y-m-d')]);
            }

            if ($khachHang && $diemTichLuy > 0) {
                $this->diemService->congDiem($khachHang, $diemTichLuy, $maHD);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công',
                'data'    => [
                    'MaHoaDon'      => $maHD,
                    'TongTienGoc'   => $tongTienGoc,
                    'TongGiam'      => $tongGiam,
                    'TongThanhToan' => $tongThanhToan,
                    'DiemTichLuy'   => $diemTichLuy,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* ==================================================================
     *  DANH SÁCH BÀN ĐANG TREO
     * ================================================================== */
    public function banDangTreo()
    {
        $data = HoaDon::with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ])
            ->where('TrangThai', 'ChuaThanhToan')
            ->orderBy('NgayLap')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /* ==================================================================
     *  DANH SÁCH HÓA ĐƠN
     * ================================================================== */
    public function index(Request $request)
    {
        $query = HoaDon::with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'nhanVien:MaNhanVien,HoTen',
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ])
            ->orderBy('NgayLap', 'desc');

        if ($request->filled('tu_ngay')) {
            $query->whereDate('NgayLap', '>=', $request->tu_ngay);
        }
        if ($request->filled('den_ngay')) {
            $query->whereDate('NgayLap', '<=', $request->den_ngay);
        }
        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->trang_thai);
        }
        if ($request->filled('keyword')) {
            $kw = $request->keyword;
            $query->whereHas('khachHang', fn ($q) =>
                $q->where('HoTen', 'like', "%{$kw}%")
                  ->orWhere('SoDienThoai', 'like', "%{$kw}%")
            );
        }

        $hoaDons = $query->paginate($request->get('per_page', 10));

        $tongDoanhThu = HoaDon::where('TrangThai', 'DaThanhToan')
            ->when($request->filled('tu_ngay'),  fn ($q) => $q->whereDate('NgayLap', '>=', $request->tu_ngay))
            ->when($request->filled('den_ngay'), fn ($q) => $q->whereDate('NgayLap', '<=', $request->den_ngay))
            ->sum('TongTien');

        return response()->json([
            'success'    => true,
            'data'       => $hoaDons->items(),
            'pagination' => [
                'current_page' => $hoaDons->currentPage(),
                'last_page'    => $hoaDons->lastPage(),
                'per_page'     => $hoaDons->perPage(),
                'total'        => $hoaDons->total(),
            ],
            'thong_ke'   => [
                'tong_hoa_don'   => $hoaDons->total(),
                'tong_doanh_thu' => $tongDoanhThu,
            ],
        ]);
    }

    /* ==================================================================
     *  CHI TIẾT HÓA ĐƠN
     * ================================================================== */
    public function show(string $maHD)
    {
        $hoaDon = HoaDon::with([
            'chiTietHoaDon.loaiVe',
            'khachHang.hangThanhVien',
            'nhanVien:MaNhanVien,HoTen',
            'hangThanhVien:MaHangThanhVien,TenHang',
        ])->find($maHD);

        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }

        return response()->json(['success' => true, 'data' => $hoaDon]);
    }

    /* ==================================================================
     *  Helper: vé có hợp lệ ở thời điểm hiện tại (buổi + ngày)
     * ================================================================== */
    private function veHopLeThoiDiemNay(LoaiVe $ve): bool
    {
        $now = now();
        $laCuoiTuan = in_array($now->dayOfWeek, [0, 6], true);
        $loaiNgayHienTai = $laCuoiTuan ? 'CuoiTuan' : 'NgayThuong';
        $buoiHienTai = $now->hour < 16 ? 'Trua' : 'Toi';

        return $ve->LoaiNgay === $loaiNgayHienTai && $ve->BuoiAn === $buoiHienTai;
    }
}
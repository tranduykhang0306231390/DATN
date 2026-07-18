<?php
// app/Http/Controllers/Api/HoaDonController.php
// Luồng: Mở bàn -> Gọi thêm / Đổi bàn / Hủy bàn -> Thanh toán (hỏi thành viên + tích điểm)

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\HangThanhVien;
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
     *  1. MỞ BÀN — tạo hóa đơn treo, CHƯA có khách hàng, CHƯA tích điểm
     * ================================================================== */
    public function store(Request $request)
    {
        $request->validate([
            'so_ban'              => 'required|integer|min:1|max:20',
            'chi_tiet'            => 'required|array|min:1',
            'chi_tiet.*.MaLoaiVe' => 'required|string|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'  => 'required|integer|min:1',
        ]);

        if ($this->banDangBan($request->so_ban)) {
            return response()->json([
                'success' => false,
                'message' => "Bàn {$request->so_ban} đang có khách.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $nhanVien = auth('nhanvien')->user();

            $tongTien    = 0;
            $chiTietData = [];

            foreach ($request->chi_tiet as $item) {
                $loaiVe = $this->kiemTraVe($item['MaLoaiVe']);
                if (!$loaiVe['ok']) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'message' => $loaiVe['message']], 422);
                }
                $ve        = $loaiVe['ve'];
                $tongTien += $ve->GiaVe * $item['SoLuong'];
                $chiTietData[] = ['ve' => $ve, 'SoLuong' => $item['SoLuong']];
            }

            $lastHD = HoaDon::orderBy('MaHoaDon', 'desc')->first();
            $soHD   = $lastHD ? ((int) substr($lastHD->MaHoaDon, 2)) + 1 : 1;
            $maHD   = 'HD' . str_pad($soHD, 3, '0', STR_PAD_LEFT);

            HoaDon::create([
                'MaHoaDon'        => $maHD,
                'NgayLap'         => now(),
                'TongTien'        => $tongTien,
                'DiemSuDung'      => 0,
                'DiemTichLuy'     => 0,
                'TrangThai'       => 'ChuaThanhToan',
                'MaNhanVien'      => $nhanVien->MaNhanVien,
                'MaKhachHang'     => null,   // hỏi khi thanh toán
                'MaQuyTacHienTai' => null,
                'MaHangThanhVien' => null,
                'MaVoucher'       => null,
                'SoBan'           => $request->so_ban,
            ]);

            foreach ($chiTietData as $ct) {
                $this->themDongChiTiet($maHD, $ct['ve'], $ct['SoLuong']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Đã mở bàn {$request->so_ban}",
                'data'    => ['MaHoaDon' => $maHD, 'SoBan' => $request->so_ban],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            if ($this->laLoiTrungBan($e)) {
                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$request->so_ban} vừa được mở bởi người khác, vui lòng chọn bàn trống khác.",
                ], 422);
            }
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra: ' . $e->getMessage()], 500);
        }
    }

    /* ==================================================================
     *  2. GỌI THÊM — thêm vé vào hóa đơn đang treo
     * ================================================================== */
    public function themMon(Request $request, string $maHD)
    {
        $request->validate([
            'chi_tiet'            => 'required|array|min:1',
            'chi_tiet.*.MaLoaiVe' => 'required|string|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'  => 'required|integer|min:1',
        ]);

        $hoaDon = HoaDon::find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể gọi thêm cho hóa đơn chưa thanh toán.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($request->chi_tiet as $item) {
                $loaiVe = $this->kiemTraVe($item['MaLoaiVe']);
                if (!$loaiVe['ok']) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'message' => $loaiVe['message']], 422);
                }
                $ve = $loaiVe['ve'];

                // Nếu vé này đã có trong hóa đơn -> cộng dồn số lượng
                $dong = ChiTietHoaDon::where('MaHoaDon', $maHD)
                    ->where('MaLoaiVe', $ve->MaLoaiVe)
                    ->first();

                if ($dong) {
                    $dong->SoLuong += $item['SoLuong'];
                    $dong->save();
                } else {
                    $this->themDongChiTiet($maHD, $ve, $item['SoLuong']);
                }
            }

            $this->capNhatTongTien($hoaDon);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã thêm vào hóa đơn',
                'data'    => ['MaHoaDon' => $maHD, 'TongTien' => $hoaDon->fresh()->TongTien],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra: ' . $e->getMessage()], 500);
        }
    }

    /* ==================================================================
     *  3. ĐỔI BÀN — chuyển hóa đơn treo sang bàn khác
     * ================================================================== */
    public function doiBan(Request $request, string $maHD)
    {
        $request->validate([
            'so_ban_moi' => 'required|integer|min:1|max:20',
        ]);

        $hoaDon = HoaDon::find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể đổi bàn cho hóa đơn chưa thanh toán.',
            ], 422);
        }
        if ((int) $hoaDon->SoBan === (int) $request->so_ban_moi) {
            return response()->json([
                'success' => false,
                'message' => 'Bàn mới trùng với bàn hiện tại.',
            ], 422);
        }
        if ($this->banDangBan($request->so_ban_moi)) {
            return response()->json([
                'success' => false,
                'message' => "Bàn {$request->so_ban_moi} đang có khách.",
            ], 422);
        }

        $banCu = $hoaDon->SoBan;
        try {
            $hoaDon->SoBan = $request->so_ban_moi;
            $hoaDon->save();
        } catch (\Exception $e) {
            if ($this->laLoiTrungBan($e)) {
                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$request->so_ban_moi} vừa được mở bởi người khác, vui lòng chọn bàn trống khác.",
                ], 422);
            }
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "Đã chuyển từ bàn {$banCu} sang bàn {$request->so_ban_moi}",
            'data'    => ['MaHoaDon' => $maHD, 'SoBan' => $hoaDon->SoBan],
        ]);
    }

    /* ==================================================================
     *  4. HỦY BÀN — khách rời đi, giải phóng bàn
     *     Hóa đơn chuyển sang DaHuy để giữ vết, không tích điểm.
     * ================================================================== */
    public function huyBan(string $maHD)
    {
        $hoaDon = HoaDon::find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể hủy bàn khi hóa đơn chưa thanh toán.',
            ], 422);
        }

        $banCu = $hoaDon->SoBan;
        $hoaDon->TrangThai = 'DaHuy';
        $hoaDon->save();

        return response()->json([
            'success' => true,
            'message' => "Đã hủy bàn {$banCu}",
        ]);
    }

    /* ==================================================================
     *  4b. HỦY HÓA ĐƠN ĐÃ THANH TOÁN (dành cho Admin) — hoàn điểm đã tích,
     *      trả lại voucher đã dùng để khách dùng lại, KHÔNG đụng tới hạng
     *      thành viên (hệ thống chỉ tự động nâng hạng, không tự hạ hạng).
     * ================================================================== */
    public function huyHoaDonDaThanhToan(Request $request, string $maHD)
    {
        $request->validate([
            'ly_do' => ['required', 'string', 'max:255'],
        ], [
            'ly_do.required' => 'Vui lòng nhập lý do hủy hóa đơn.',
        ]);

        $hoaDon = HoaDon::find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'DaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể hủy những hóa đơn đã thanh toán qua chức năng này.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Trả lại voucher đã dùng (nếu có) để khách dùng lại lần sau
            $soVoucherHoan = 0;
            if (!empty($hoaDon->MaVoucher)) {
                $maVoucherList = array_filter(explode(',', $hoaDon->MaVoucher));
                if (!empty($maVoucherList)) {
                    $soVoucherHoan = VoucherKhachHang::whereIn('MaVoucherKhachHang', $maVoucherList)
                        ->update(['TrangThai' => 'ChuaSuDung', 'NgaySuDung' => null]);
                }
            }

            // Hoàn điểm đã tích (nếu có khách hàng gắn với hóa đơn) — có thể
            // kéo theo tự động hạ hạng nếu khách không còn đủ điểm giữ hạng.
            $hangTruoc = null;
            $hangSau   = null;
            if ($hoaDon->MaKhachHang && $hoaDon->DiemTichLuy > 0) {
                $khachHang = KhachHang::find($hoaDon->MaKhachHang);
                if ($khachHang) {
                    $hangTruoc = $khachHang->MaHangThanhVien;
                    $this->diemService->hoanDiem($khachHang, (int) $hoaDon->DiemTichLuy, $maHD);
                    $hangSau = $khachHang->fresh()->MaHangThanhVien;
                }
            }

            $hoaDon->TrangThai     = 'DaHuy';
            $hoaDon->LyDoHuy       = $request->input('ly_do');
            $hoaDon->ThoiGianHuy   = now();
            $hoaDon->MaNhanVienHuy = auth('nhanvien')->user()->MaNhanVien;
            $hoaDon->save();

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi khi hủy hóa đơn: ' . $e->getMessage(),
            ], 500);
        }

        $daHaHang = $hangTruoc && $hangSau && $hangTruoc !== $hangSau;

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy hóa đơn đã thanh toán',
            'data'    => [
                'MaHoaDon'      => $maHD,
                'DiemDaHoan'    => (int) $hoaDon->DiemTichLuy,
                'SoVoucherHoan' => $soVoucherHoan,
                'LyDoHuy'       => $hoaDon->LyDoHuy,
                'DaHaHang'      => $daHaHang,
                'TenHangMoi'    => $daHaHang ? (HangThanhVien::find($hangSau)->TenHang ?? null) : null,
            ],
        ]);
    }

    /* ==================================================================
     *  5. ƯỚC TÍNH — xem trước tiền giảm & điểm, KHÔNG lưu gì
     * ================================================================== */
    public function uocTinh(Request $request, string $maHD)
    {
        $request->validate([
            'ma_khach_hang'    => 'nullable|string|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung' => 'nullable|array',
        ]);

        $hoaDon = HoaDon::with('chiTietHoaDon')->find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }

        $khachHang = $request->ma_khach_hang
            ? KhachHang::with(['hangThanhVien.quyTac'])->find($request->ma_khach_hang)
            : null;

        $kq = $this->tinhToanHoaDon($hoaDon, $khachHang, $request->input('vouchers_ap_dung', []) ?? []);

        return response()->json([
            'success' => true,
            'data'    => [
                'TongTienGoc'   => $kq['tongTienGoc'],
                'TongGiam'      => $kq['tongGiam'],
                'TongThanhToan' => $kq['tongThanhToan'],
                'DiemTichLuy'   => $kq['diemTichLuy'],
                'LaSinhNhat'    => $kq['laSinhNhat'],
                'SoVoucherApDung' => count($kq['maVoucherList']),
                'TenHang'       => $kq['tenHang'],
                'QuyTac'        => $kq['quyTacInfo'],
            ],
        ]);
    }

    /* ==================================================================
     *  6. THANH TOÁN — chốt hóa đơn, tích điểm
     * ================================================================== */
    public function thanhToan(Request $request, string $maHD)
    {
        $request->validate([
            'ma_khach_hang'    => 'nullable|string|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung' => 'nullable|array',
        ]);

        $hoaDon = HoaDon::with('chiTietHoaDon')->find($maHD);
        if (!$hoaDon) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn'], 404);
        }
        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Hóa đơn này đã được thanh toán hoặc đã hủy.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $khachHang = $request->ma_khach_hang
                ? KhachHang::with(['hangThanhVien.quyTac'])->find($request->ma_khach_hang)
                : null;

            // Dùng CHUNG hàm tính với chức năng ước tính -> số liệu luôn khớp
            $kq = $this->tinhToanHoaDon($hoaDon, $khachHang, $request->input('vouchers_ap_dung', []) ?? []);

            $hoaDon->update([
                'TongTien'        => $kq['tongThanhToan'],
                'DiemTichLuy'     => $kq['diemTichLuy'],
                'TrangThai'       => 'DaThanhToan',
                'MaKhachHang'     => $khachHang?->MaKhachHang,
                'MaHangThanhVien' => $khachHang?->MaHangThanhVien,
                'MaQuyTacHienTai' => $kq['maQuyTac'],
                'MaVoucher'       => implode(',', $kq['maVoucherList']) ?: null,
            ]);

            if (!empty($kq['maVoucherList'])) {
                VoucherKhachHang::whereIn('MaVoucherKhachHang', $kq['maVoucherList'])
                    ->update(['TrangThai' => 'DaSuDung', 'NgaySuDung' => now()->format('Y-m-d')]);
            }

            if ($khachHang && $kq['diemTichLuy'] > 0) {
                $this->diemService->congDiem($khachHang, $kq['diemTichLuy'], $maHD);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công',
                'data'    => [
                    'MaHoaDon'      => $maHD,
                    'TongTienGoc'   => $kq['tongTienGoc'],
                    'TongGiam'      => $kq['tongGiam'],
                    'TongThanhToan' => $kq['tongThanhToan'],
                    'DiemTichLuy'   => $kq['diemTichLuy'],
                    'LaSinhNhat'    => $kq['laSinhNhat'],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Tính tiền giảm + điểm tích lũy cho một hóa đơn.
     * Dùng chung cho cả ước tính (không lưu) và thanh toán (có lưu).
     */
    private function tinhToanHoaDon(HoaDon $hoaDon, ?KhachHang $khachHang, array $voucherIds): array
    {
        $tongTienGoc = $hoaDon->chiTietHoaDon->sum(fn ($ct) => $ct->DonGia * $ct->SoLuong);

        // ── Áp voucher: thứ tự ưu tiên + dùng chung + không vượt tổng tiền
        $tongGiam      = 0;
        $maVoucherList = [];

        if ($khachHang && !empty($voucherIds)) {
            $vouchers = VoucherKhachHang::with('uuDai')
                ->whereIn('MaVoucherKhachHang', $voucherIds)
                ->where('MaKhachHang', $khachHang->MaKhachHang)
                ->where('TrangThai', 'ChuaSuDung')
                ->where('NgayHetHan', '>=', now()->format('Y-m-d'))
                ->get()
                // Sắp theo thứ tự ưu tiên: giảm tiền/tặng món trước, giảm % sau cùng
                ->sortBy('uuDai.ThuTuApDung');

            $nhomDaSuDung = [];
            $conLai       = $tongTienGoc;   // số tiền còn phải trả sau mỗi lần giảm

            foreach ($vouchers as $v) {
                if ($conLai <= 0) break;

                $nhom = $v->uuDai->NhomUuDai;
                if (isset($nhomDaSuDung[$nhom]) && !$v->uuDai->CoTheDungChung) continue;

                // ĐIỀU KIỆN 1 — Hóa đơn phải đạt giá trị tối thiểu của ưu đãi.
                // Xét trên TỔNG GỐC vì điều kiện in trên voucher là
                // "áp dụng cho hóa đơn từ X trở lên".
                $mucToiThieu = (float) ($v->uuDai->GiaTriHoaDonToiThieu ?? 0);
                if ($mucToiThieu > 0 && $tongTienGoc < $mucToiThieu) {
                    continue;   // không đủ điều kiện -> giữ lại cho khách
                }

                // Phần trăm tính trên số tiền CÒN LẠI, không phải tổng gốc.
                $giam = $nhom === 'PhanTram'
                    ? $conLai * ($v->uuDai->GiaTriGiam / 100)
                    : (float) $v->uuDai->GiaTriGiam;

                // ĐIỀU KIỆN 2 — Voucher giảm tiền / tặng món phải dùng được
                // TRỌN GIÁ TRỊ. Nếu số tiền còn lại nhỏ hơn giá trị voucher thì
                // bỏ qua, giữ nguyên cho khách thay vì đốt phần thừa.
                if ($nhom !== 'PhanTram' && $giam > $conLai) {
                    continue;
                }

                // Chốt chặn cuối: không bao giờ giảm quá số còn lại
                $giam = min($giam, $conLai);
                if ($giam <= 0) continue;

                $conLai   -= $giam;
                $tongGiam += $giam;
                $nhomDaSuDung[$nhom] = true;
                $maVoucherList[]     = $v->MaVoucherKhachHang;
            }
        }

        $tongThanhToan = max(0, $tongTienGoc - $tongGiam);

        // ── Tính điểm
        $diemTichLuy = 0;
        $maQuyTac    = null;
        $laSinhNhat  = false;
        $tenHang     = null;
        $quyTacInfo  = null;

        if ($khachHang) {
            $tenHang = $khachHang->hangThanhVien->TenHang ?? null;
            $quyTac  = $khachHang->hangThanhVien->quyTac ?? null;

            if ($quyTac && $quyTac->TrangThai === 'HoatDong') {
                $ketQuaDiem = $this->diemService->tinhDiem(
                    $quyTac,
                    (float) $tongThanhToan,
                    $khachHang->NgaySinh
                );
                $diemTichLuy = $ketQuaDiem['diem'];
                $maQuyTac    = $quyTac->MaQuyTac;
                $laSinhNhat  = $ketQuaDiem['laSinhNhat'];

                // Thông tin chi tiết cách tính để hiển thị minh bạch cho
                // nhân viên/khách xem lúc thanh toán (không chỉ con số cuối).
                $quyTacInfo = [
                    'MaQuyTac'             => $quyTac->MaQuyTac,
                    'SoTienQuyDoi'         => $ketQuaDiem['soTienQuyDoi'],
                    'SoDiemNhan'           => $ketQuaDiem['soDiemNhan'],
                    'GiaTriHoaDonToiThieu' => $ketQuaDiem['mucToiThieu'],
                    'HeSoNhanDiem'         => $ketQuaDiem['heSo'],
                    'ApDungHeSo'           => $ketQuaDiem['apDungHeSo'],
                    'DiemCoBan'            => $ketQuaDiem['diemCoBan'],
                ];
            }
        }

        return [
            'tongTienGoc'   => $tongTienGoc,
            'tongGiam'      => $tongGiam,
            'tongThanhToan' => $tongThanhToan,
            'diemTichLuy'   => $diemTichLuy,
            'maQuyTac'      => $maQuyTac,
            'maVoucherList' => $maVoucherList,
            'laSinhNhat'    => $laSinhNhat,
            'tenHang'       => $tenHang,
            'quyTacInfo'    => $quyTacInfo,
        ];
    }

    /* ==================================================================
     *  DANH SÁCH BÀN ĐANG PHỤC VỤ
     * ================================================================== */
    public function banDangTreo()
    {
        $data = HoaDon::with(['chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe'])
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

        if ($request->filled('tu_ngay'))  $query->whereDate('NgayLap', '>=', $request->tu_ngay);
        if ($request->filled('den_ngay')) $query->whereDate('NgayLap', '<=', $request->den_ngay);
        if ($request->filled('trang_thai')) $query->where('TrangThai', $request->trang_thai);
        if ($request->filled('keyword')) {
            $kw = $request->keyword;
            $query->whereHas('khachHang', fn ($q) =>
                $q->where('HoTen', 'like', "%{$kw}%")->orWhere('SoDienThoai', 'like', "%{$kw}%")
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
     *  HÀM HỖ TRỢ
     * ================================================================== */

    /**
     * Có phải lỗi vi phạm ràng buộc "1 bàn chỉ được 1 hóa đơn đang treo"
     * (unique index hoadon_soban_dangmo_unique) không.
     * Đây là lớp bảo vệ cuối cùng chống race condition khi 2 thu ngân
     * cùng mở/đổi 1 bàn gần như đồng thời — check trước đó (banDangBan)
     * chỉ để fail nhanh cho UX, không đủ để chống race vì không lock.
     */
    private function laLoiTrungBan(\Throwable $e): bool
    {
        return $e instanceof \Illuminate\Database\QueryException
            && str_contains($e->getMessage(), 'hoadon_soban_dangmo_unique');
    }

    /** Bàn này có hóa đơn đang treo không */
    private function banDangBan($soBan): bool
    {
        return HoaDon::where('SoBan', $soBan)
            ->where('TrangThai', 'ChuaThanhToan')
            ->exists();
    }

    /** Kiểm tra vé còn bán và hợp lệ với buổi + loại ngày hiện tại */
    private function kiemTraVe(string $maLoaiVe): array
    {
        $ve = LoaiVe::find($maLoaiVe);

        if (!$ve || $ve->TrangThai !== 'HoatDong') {
            return ['ok' => false, 'message' => "Loại vé {$maLoaiVe} không khả dụng"];
        }

        $now        = now();
        $loaiNgay   = in_array($now->dayOfWeek, [0, 6], true) ? 'CuoiTuan' : 'NgayThuong';
        $buoi       = $now->hour < 16 ? 'Trua' : 'Toi';

        if ($ve->LoaiNgay !== $loaiNgay || $ve->BuoiAn !== $buoi) {
            return ['ok' => false, 'message' => "Vé \"{$ve->TenLoaiVe}\" không áp dụng cho thời điểm hiện tại."];
        }

        return ['ok' => true, 've' => $ve];
    }

    /** Thêm một dòng chi tiết hóa đơn */
    private function themDongChiTiet(string $maHD, LoaiVe $ve, int $soLuong): void
    {
        $lastCT = ChiTietHoaDon::orderBy('MaChiTietHD', 'desc')->first();
        $soCT   = $lastCT ? ((int) substr($lastCT->MaChiTietHD, 4)) + 1 : 1;

        ChiTietHoaDon::create([
            'MaChiTietHD' => 'CTHD' . str_pad($soCT, 3, '0', STR_PAD_LEFT),
            'SoLuong'     => $soLuong,
            'DonGia'      => $ve->GiaVe,
            'MaHoaDon'    => $maHD,
            'MaLoaiVe'    => $ve->MaLoaiVe,
        ]);
    }

    /** Tính lại tổng tiền tạm của hóa đơn treo */
    private function capNhatTongTien(HoaDon $hoaDon): void
    {
        $tong = ChiTietHoaDon::where('MaHoaDon', $hoaDon->MaHoaDon)
            ->get()
            ->sum(fn ($ct) => $ct->DonGia * $ct->SoLuong);

        $hoaDon->TongTien = $tong;
        $hoaDon->save();
    }
}
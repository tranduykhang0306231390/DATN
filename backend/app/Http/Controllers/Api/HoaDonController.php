<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\MoBanKhongThanhCongException;
use App\Http\Controllers\Controller;
use App\Models\BanAn;
use App\Models\CauHinhDatBan;
use App\Models\ChiTietHoaDon;
use App\Models\DatBan;
use App\Models\HoaDon;
use App\Models\KhachHang;
use App\Models\LoaiVe;
use App\Models\UuDai;
use App\Models\VoucherKhachHang;
use App\Services\DiemTichLuyService;
use App\Services\MoBanService;
use App\Services\SequentialCodeService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HoaDonController extends Controller
{
    public function __construct(
        private DiemTichLuyService $diemService,
        private SequentialCodeService $codes,
        private MoBanService $moBanService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Mở bàn
    |--------------------------------------------------------------------------
    |
    | Chỉ tạo hóa đơn treo và chi tiết vé.
    | Khách hàng, voucher và tích điểm được xử lý ở bước thanh toán.
    |
    */

    public function store(Request $request)
    {
        $data = $request->validate([
            'so_ban' => [
                'required',
                'string',
                'max:20',
                'exists:banan,MaBan',
            ],

            'chi_tiet' => [
                'required',
                'array',
                'min:1',
                'max:50',
            ],

            'chi_tiet.*.MaLoaiVe' => [
                'required',
                'string',
                'max:20',
                'distinct',
                'exists:loaive,MaLoaiVe',
            ],

            'chi_tiet.*.SoLuong' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],
        ], [
            'so_ban.required' =>
                'Vui lòng chọn bàn.',

            'so_ban.exists' =>
                'Bàn được chọn không tồn tại.',

            'chi_tiet.required' =>
                'Vui lòng chọn ít nhất một loại vé.',

            'chi_tiet.min' =>
                'Vui lòng chọn ít nhất một loại vé.',

            'chi_tiet.*.MaLoaiVe.distinct' =>
                'Mỗi loại vé chỉ được gửi một lần.',
        ]);

        $nhanVien = auth('nhanvien')->user();

        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không xác định được tài khoản nhân viên.',
            ], 401);
        }

        DB::beginTransaction();

        try {
            $result = $this->moBanService->moBan(
                $data['so_ban'],
                $data['chi_tiet'],
                $nhanVien
            );

            $canhBao = $this->canhBaoDatBanSapToi($data['so_ban']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    "Đã mở bàn {$data['so_ban']}.",

                'data' => $result,
                'canh_bao_dat_ban' => $canhBao,
            ], 201);
        } catch (MoBanKhongThanhCongException $exception) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->status);
        } catch (\Throwable $exception) {
            DB::rollBack();

            if ($this->laLoiTrungBan($exception)) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        "Bàn {$data['so_ban']} vừa được mở bởi người khác.",
                ], 422);
            }

            Log::error('Không thể mở bàn', [
                'staff_id' => auth('nhanvien')->id(),
                'table' => $data['so_ban'],
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể mở bàn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Thêm món
    |--------------------------------------------------------------------------
    */

    public function themMon(
        Request $request,
        string $maHD
    ) {
        $data = $request->validate([
            'chi_tiet' => [
                'required',
                'array',
                'min:1',
                'max:50',
            ],

            'chi_tiet.*.MaLoaiVe' => [
                'required',
                'string',
                'max:20',
                'distinct',
                'exists:loaive,MaLoaiVe',
            ],

            'chi_tiet.*.SoLuong' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        DB::beginTransaction();

        try {
            $hoaDon = HoaDon::query()
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Không tìm thấy hóa đơn.',
                ], 404);
            }

            if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Chỉ có thể thêm món cho hóa đơn chưa thanh toán.',
                ], 422);
            }

            $maLoaiVeList = collect($data['chi_tiet'])
                ->pluck('MaLoaiVe')
                ->sort()
                ->values();

            $ticketTypes = LoaiVe::query()
                ->whereIn('MaLoaiVe', $maLoaiVeList)
                ->orderBy('MaLoaiVe')
                ->lockForUpdate()
                ->get()
                ->keyBy('MaLoaiVe');

            $chiTietHienTai = ChiTietHoaDon::query()
                ->where('MaHoaDon', $maHD)
                ->orderBy('MaChiTietHD')
                ->lockForUpdate()
                ->get()
                ->keyBy('MaLoaiVe');

            $dongMoi = [];

            foreach ($data['chi_tiet'] as $item) {
                $loaiVe = $ticketTypes->get(
                    $item['MaLoaiVe']
                );

                if (
                    !$loaiVe
                    || $loaiVe->TrangThai !== 'HoatDong'
                ) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' =>
                            "Loại vé {$item['MaLoaiVe']} không khả dụng.",
                    ], 422);
                }

                if (!$this->veHopLeThoiDiemNay($loaiVe)) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' =>
                            "Vé \"{$loaiVe->TenLoaiVe}\" không áp dụng cho thời điểm hiện tại.",
                    ], 422);
                }

                $soLuongThem = (int) $item['SoLuong'];

                $dongHienTai = $chiTietHienTai->get(
                    $loaiVe->MaLoaiVe
                );

                if ($dongHienTai) {
                    $soLuongMoi =
                        (int) $dongHienTai->SoLuong
                        + $soLuongThem;

                    if ($soLuongMoi > 100) {
                        DB::rollBack();

                        return response()->json([
                            'success' => false,
                            'message' =>
                                "Tổng số lượng vé \"{$loaiVe->TenLoaiVe}\" không được vượt quá 100.",
                        ], 422);
                    }

                    $dongHienTai->SoLuong = $soLuongMoi;
                    $dongHienTai->save();

                    continue;
                }

                $dongMoi[] = [
                    'loaiVe' => $loaiVe,
                    'SoLuong' => $soLuongThem,
                ];
            }

            if ($dongMoi !== []) {
                $detailCodes = $this->codes->nextBatch(
                    'chitiethoadon',
                    'MaChiTietHD',
                    'CTHD',
                    count($dongMoi)
                );

                foreach ($dongMoi as $index => $item) {
                    ChiTietHoaDon::create([
                        'MaChiTietHD' =>
                            $detailCodes[$index],

                        'SoLuong' =>
                            $item['SoLuong'],

                        'DonGia' =>
                            $item['loaiVe']->GiaVe,

                        'MaHoaDon' =>
                            $maHD,

                        'MaLoaiVe' =>
                            $item['loaiVe']->MaLoaiVe,
                    ]);
                }
            }

            $tongTien = $this->tinhTongTienGoc($maHD);

            $hoaDon->TongTien = $tongTien;
            $hoaDon->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    'Đã thêm món vào hóa đơn.',

                'data' => [
                    'MaHoaDon' => $maHD,
                    'TongTien' => $tongTien,
                ],
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể thêm món', [
                'invoice_id' => $maHD,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể thêm món lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Đổi bàn
    |--------------------------------------------------------------------------
    */

    public function doiBan(
        Request $request,
        string $maHD
    ) {
        $data = $request->validate([
            'so_ban_moi' => [
                'required',
                'string',
                'max:20',
                'exists:banan,MaBan',
            ],
        ], [
            'so_ban_moi.exists' =>
                'Bàn được chọn không tồn tại.',
        ]);

        DB::beginTransaction();

        try {
            /*
             * Khóa đúng bàn đích để tránh mở bàn và đổi bàn đồng thời
             * cùng chiếm một bàn (thay cho việc khóa toàn bảng LoaiVe
             * làm mutex chung trước đây — khóa theo từng bàn cụ thể
             * chính xác hơn và không còn serialize các bàn khác nhau).
             */
            $banMoi = BanAn::query()
                ->where('MaBan', $data['so_ban_moi'])
                ->lockForUpdate()
                ->first();

            if (!$banMoi || $banMoi->TrangThai !== 'HoatDong') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        "Bàn {$data['so_ban_moi']} không khả dụng.",
                ], 422);
            }

            $hoaDon = HoaDon::query()
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Không tìm thấy hóa đơn.',
                ], 404);
            }

            if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Chỉ có thể đổi bàn cho hóa đơn chưa thanh toán.',
                ], 422);
            }

            $soBanMoi = $data['so_ban_moi'];
            $soBanCu = $hoaDon->SoBan;

            if ($soBanMoi === $soBanCu) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Bàn mới trùng với bàn hiện tại.',
                ], 422);
            }

            $banMoiDangBan = HoaDon::query()
                ->where('SoBan', $soBanMoi)
                ->where('TrangThai', 'ChuaThanhToan')
                ->where('MaHoaDon', '!=', $maHD)
                ->lockForUpdate()
                ->exists();

            if ($banMoiDangBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        "Bàn {$soBanMoi} đang có khách.",
                ], 422);
            }

            $hoaDon->SoBan = $soBanMoi;
            $hoaDon->save();

            $canhBao = $this->canhBaoDatBanSapToi($soBanMoi);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    "Đã chuyển từ bàn {$soBanCu} sang bàn {$soBanMoi}.",

                'data' => [
                    'MaHoaDon' => $maHD,
                    'SoBan' => $soBanMoi,
                ],
                'canh_bao_dat_ban' => $canhBao,
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            if ($this->laLoiTrungBan($exception)) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        "Bàn {$data['so_ban_moi']} vừa được người khác sử dụng.",
                ], 422);
            }

            Log::error('Không thể đổi bàn', [
                'invoice_id' => $maHD,
                'target_table' => $data['so_ban_moi'],
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể đổi bàn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Hủy bàn đang phục vụ
    |--------------------------------------------------------------------------
    */

    public function huyBan(string $maHD)
    {
        DB::beginTransaction();

        try {
            $hoaDon = HoaDon::query()
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Không tìm thấy hóa đơn.',
                ], 404);
            }

            if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Chỉ có thể hủy bàn khi hóa đơn chưa thanh toán.',
                ], 422);
            }

            $soBan = $hoaDon->SoBan;

            $hoaDon->TrangThai = 'DaHuy';
            $hoaDon->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    "Đã hủy bàn {$soBan}.",
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể hủy bàn', [
                'invoice_id' => $maHD,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể hủy bàn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Ước tính thanh toán
    |--------------------------------------------------------------------------
    |
    | Chỉ tính trước, không thay đổi hóa đơn, voucher hoặc điểm.
    |
    */

    public function uocTinh(
        Request $request,
        string $maHD
    ) {
        $data = $request->validate([
            'ma_khach_hang' => [
                'nullable',
                'string',
                'max:20',
                'exists:khachhang,MaKhachHang',
            ],

            'vouchers_ap_dung' => [
                'nullable',
                'array',
                'max:10',
            ],

            'vouchers_ap_dung.*' => [
                'string',
                'max:20',
                'distinct',
                'exists:voucherkhachhang,MaVoucherKhachHang',
            ],
        ]);

        $hoaDon = HoaDon::query()
            ->with('chiTietHoaDon')
            ->find($maHD);

        if (!$hoaDon) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không tìm thấy hóa đơn.',
            ], 404);
        }

        if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Chỉ có thể ước tính hóa đơn chưa thanh toán.',
            ], 422);
        }

        /*
         * Nếu request không gửi kèm khách hàng, mặc định dùng khách hàng đã
         * gắn sẵn trên hóa đơn (ví dụ hóa đơn mở từ check-in một lượt đặt
         * bàn trước) — tránh bắt nhân viên phải tra cứu lại thủ công.
         */
        $maKhachHang = $data['ma_khach_hang'] ?? $hoaDon->MaKhachHang;

        $khachHang = null;

        if (!empty($maKhachHang)) {
            $khachHang = KhachHang::query()
                ->with('hangThanhVien.quyTac')
                ->find($maKhachHang);

            if (
                !$khachHang
                || $khachHang->TrangThai !== 'HoatDong'
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Tài khoản khách hàng không hoạt động.',
                ], 422);
            }
        }

        $voucherIds = $this->normalizeVoucherIds(
            $data['vouchers_ap_dung'] ?? []
        );

        if ($voucherIds->isNotEmpty() && !$khachHang) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Cần chọn khách hàng trước khi áp dụng voucher.',
            ], 422);
        }

        $tongTienGoc = $hoaDon->chiTietHoaDon
            ->sum(
                fn($chiTiet) =>
                (float) $chiTiet->DonGia
                * (int) $chiTiet->SoLuong
            );

        $vouchers = collect();
        $invalidVoucherIds = collect();

        if ($khachHang && $voucherIds->isNotEmpty()) {
            [$vouchers, $invalidVoucherIds] =
                $this->loadAndValidateVouchers(
                    $voucherIds,
                    $khachHang->MaKhachHang,
                    false
                );
        }

        $voucherResult = $this->tinhGiamGiaVoucher(
            $vouchers,
            $tongTienGoc
        );

        $unavailableVoucherIds = $invalidVoucherIds
            ->merge($voucherResult['khongApDung'])
            ->unique()
            ->values();

        $pointResult = $this->tinhDiemHoaDon(
            $khachHang,
            $voucherResult['tongThanhToan']
        );

        /*
         * Xem trước phần cọc sẽ bị trừ, để nhân viên không báo nhầm số tiền
         * cho khách trước khi thực sự bấm Xác nhận thanh toán — cùng công
         * thức với thanhToan(), chỉ khác là không ghi gì vào CSDL ở đây.
         */
        $datBan = $hoaDon->MaDatBan
            ? DatBan::query()->where('MaDatBan', $hoaDon->MaDatBan)->first()
            : null;

        $soTienCocSeTru = ($datBan && $datBan->TrangThaiHoanTien !== 'DaTruVaoHoaDon')
            ? (float) $datBan->SoTienCoc
            : 0.0;

        $soTienConLaiPhaiTra = max(0, $voucherResult['tongThanhToan'] - $soTienCocSeTru);

        return response()->json([
            'success' => true,

            'data' => [
                'TongTienGoc' =>
                    $tongTienGoc,

                'TongGiam' =>
                    $voucherResult['tongGiam'],

                'TongThanhToan' =>
                    $voucherResult['tongThanhToan'],

                'SoTienCocDaTru' =>
                    $soTienCocSeTru,

                'SoTienConLaiPhaiTra' =>
                    $soTienConLaiPhaiTra,

                'DiemTichLuy' =>
                    $pointResult['diemTichLuy'],

                'LaSinhNhat' =>
                    $pointResult['laSinhNhat'],

                'TenHang' =>
                    $pointResult['tenHang'],

                'QuyTac' =>
                    $pointResult['quyTacInfo'],

                'SoVoucherApDung' =>
                    count($voucherResult['maVoucherApDung']),

                'VoucherApDung' =>
                    $voucherResult['maVoucherApDung'],

                'VoucherKhongApDung' =>
                    $unavailableVoucherIds,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Thanh toán
    |--------------------------------------------------------------------------
    |
    | Chọn khách hàng và voucher ở bước cuối.
    | Khóa hóa đơn, khách hàng và voucher để chống thanh toán hai lần.
    |
    */

    public function thanhToan(
        Request $request,
        string $maHD
    ) {
        $data = $request->validate([
            'ma_khach_hang' => [
                'nullable',
                'string',
                'max:20',
                'exists:khachhang,MaKhachHang',
            ],

            'vouchers_ap_dung' => [
                'nullable',
                'array',
                'max:10',
            ],

            'vouchers_ap_dung.*' => [
                'string',
                'max:20',
                'distinct',
                'exists:voucherkhachhang,MaVoucherKhachHang',
            ],

            'continue_without_invalid_vouchers' => [
                'sometimes',
                'boolean',
            ],
        ]);

        DB::beginTransaction();

        try {
            $hoaDon = HoaDon::query()
                ->with('chiTietHoaDon')
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Không tìm thấy hóa đơn.',
                ], 404);
            }

            if ($hoaDon->TrangThai !== 'ChuaThanhToan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Hóa đơn này đã được thanh toán hoặc đã hủy.',
                ], 422);
            }

            if ($hoaDon->chiTietHoaDon->isEmpty()) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Hóa đơn không có chi tiết để thanh toán.',
                ], 422);
            }

            /*
             * Nếu request không gửi kèm khách hàng, mặc định dùng khách hàng
             * đã gắn sẵn trên hóa đơn (ví dụ hóa đơn mở từ check-in một lượt
             * đặt bàn trước) — tránh bắt nhân viên phải tra cứu lại thủ công.
             */
            $maKhachHang = $data['ma_khach_hang'] ?? $hoaDon->MaKhachHang;

            $khachHang = null;

            if (!empty($maKhachHang)) {
                $khachHang = KhachHang::query()
                    ->with('hangThanhVien.quyTac')
                    ->where(
                        'MaKhachHang',
                        $maKhachHang
                    )
                    ->lockForUpdate()
                    ->first();

                if (
                    !$khachHang
                    || $khachHang->TrangThai !== 'HoatDong'
                ) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' =>
                            'Tài khoản khách hàng không hoạt động.',
                    ], 422);
                }
            }

            $voucherIds = $this->normalizeVoucherIds(
                $data['vouchers_ap_dung'] ?? []
            );

            if ($voucherIds->isNotEmpty() && !$khachHang) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Cần chọn khách hàng trước khi áp dụng voucher.',
                ], 422);
            }

            $tongTienGoc = $hoaDon->chiTietHoaDon
                ->sum(
                    fn($chiTiet) =>
                    (float) $chiTiet->DonGia
                    * (int) $chiTiet->SoLuong
                );

            $vouchers = collect();
            $invalidVoucherIds = collect();

            if ($khachHang && $voucherIds->isNotEmpty()) {
                [$vouchers, $invalidVoucherIds] =
                    $this->loadAndValidateVouchers(
                        $voucherIds,
                        $khachHang->MaKhachHang,
                        true
                    );
            }

            $voucherResult = $this->tinhGiamGiaVoucher(
                $vouchers,
                $tongTienGoc
            );

            $unavailableVoucherIds = $invalidVoucherIds
                ->merge($voucherResult['khongApDung'])
                ->unique()
                ->values();

            if (
                $unavailableVoucherIds->isNotEmpty()
                && !($data['continue_without_invalid_vouchers'] ?? false)
            ) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'code' => 'VOUCHERS_INVALID',
                    'message' =>
                        'Một số voucher không còn hiệu lực, không đạt giá trị hóa đơn tối thiểu hoặc không thể dùng chung.',

                    'invalid_vouchers' =>
                        $unavailableVoucherIds,
                ], 409);
            }

            $pointResult = $this->tinhDiemHoaDon(
                $khachHang,
                $voucherResult['tongThanhToan']
            );

            /*
             * Ghi lại hạng trước khi cộng điểm.
             * Sau khi cộng điểm, khách hàng có thể được tự động nâng hạng.
             */
            $maHangTaiThoiDiemThanhToan =
                $khachHang?->MaHangThanhVien;

            /*
             * Nếu hóa đơn phát sinh từ một lượt đặt bàn trước đã đóng cọc,
             * trừ số cọc vào số tiền còn phải thu tại quầy. Điểm tích lũy
             * ở trên vẫn tính trên tổng thanh toán gốc, không trừ cọc.
             */
            $datBan = $hoaDon->MaDatBan
                ? DatBan::query()
                    ->where('MaDatBan', $hoaDon->MaDatBan)
                    ->lockForUpdate()
                    ->first()
                : null;

            /*
             * Chỉ trừ cọc nếu chưa từng trừ — chống trừ 2 lần nếu hàm này
             * bị gọi lại (ví dụ do lỗi mạng khiến client gọi lại request).
             */
            $soTienCocTru = ($datBan && $datBan->TrangThaiHoanTien !== 'DaTruVaoHoaDon')
                ? (float) $datBan->SoTienCoc
                : 0.0;

            $soTienConLaiPhaiTra = max(0, $voucherResult['tongThanhToan'] - $soTienCocTru);

            $hoaDon->TongTien =
                $soTienConLaiPhaiTra;

            $hoaDon->DiemTichLuy =
                max(0, (int) ($pointResult['diemTichLuy'] ?? 0));

            $hoaDon->TrangThai =
                'DaThanhToan';

            /*
             * NgayLap sau thanh toán thể hiện thời điểm hóa đơn được chốt.
             */
            $hoaDon->NgayLap =
                now();

            $hoaDon->MaKhachHang =
                $khachHang?->MaKhachHang;

            $hoaDon->MaHangThanhVien =
                $maHangTaiThoiDiemThanhToan;

            $hoaDon->MaQuyTacHienTai =
                $pointResult['maQuyTac'] ?? null;

            $hoaDon->MaVoucher =
                !empty($voucherResult['maVoucherApDung'])
                ? implode(
                    ',',
                    $voucherResult['maVoucherApDung']
                )
                : null;

            $hoaDon->save();

            if ($datBan) {
                $datBan->TrangThai = 'HoanTat';

                if ($soTienCocTru > 0) {
                    $datBan->TrangThaiHoanTien = 'DaTruVaoHoaDon';
                }

                $datBan->save();
            }

            if ($voucherResult['maVoucherApDung'] !== []) {
                VoucherKhachHang::query()
                    ->whereIn(
                        'MaVoucherKhachHang',
                        $voucherResult['maVoucherApDung']
                    )
                    ->update([
                        'TrangThai' => 'DaSuDung',
                        'NgaySuDung' => now()->toDateString(),
                    ]);
            }

            if (
                $khachHang
                && $pointResult['diemTichLuy'] > 0
            ) {
                $this->diemService->congDiem(
                    $khachHang,
                    $pointResult['diemTichLuy'],
                    $maHD
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    'Thanh toán thành công.',

                'data' => [
                    'MaHoaDon' =>
                        $maHD,

                    'TongTienGoc' =>
                        $tongTienGoc,

                    'TongGiam' =>
                        $voucherResult['tongGiam'],

                    'TongThanhToan' =>
                        $voucherResult['tongThanhToan'],

                    'SoTienCocDaTru' =>
                        $soTienCocTru,

                    'SoTienConLaiPhaiTra' =>
                        $soTienConLaiPhaiTra,

                    'DiemTichLuy' =>
                        $pointResult['diemTichLuy'],

                    'LaSinhNhat' =>
                        $pointResult['laSinhNhat'],

                    'VoucherApDung' =>
                        $voucherResult['maVoucherApDung'],

                    'VoucherBiBoQua' =>
                        $unavailableVoucherIds,
                ],
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể thanh toán hóa đơn', [
                'invoice_id' => $maHD,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể thanh toán hóa đơn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Hủy hóa đơn đã thanh toán
    |--------------------------------------------------------------------------
    */

    public function huyHoaDonDaThanhToan(
        Request $request,
        string $maHD
    ) {
        $data = $request->validate([
            'ly_do' => [
                'required',
                'string',
                'max:255',
            ],
        ], [
            'ly_do.required' =>
                'Vui lòng nhập lý do hủy hóa đơn.',
        ]);

        DB::beginTransaction();

        try {
            $hoaDon = HoaDon::query()
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Không tìm thấy hóa đơn.',
                ], 404);
            }

            if ($hoaDon->TrangThai !== 'DaThanhToan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Chỉ có thể hủy hóa đơn đã thanh toán.',
                ], 422);
            }

            $voucherIds = $this->normalizeVoucherIds(
                !empty($hoaDon->MaVoucher)
                ? explode(',', $hoaDon->MaVoucher)
                : []
            );

            $soVoucherHoan = 0;

            if ($voucherIds->isNotEmpty()) {
                /*
                 * Khóa trước khi trả lại voucher để tránh request khác
                 * sử dụng voucher đồng thời.
                 */
                VoucherKhachHang::query()
                    ->whereIn(
                        'MaVoucherKhachHang',
                        $voucherIds
                    )
                    ->orderBy('MaVoucherKhachHang')
                    ->lockForUpdate()
                    ->get();

                $soVoucherHoan = VoucherKhachHang::query()
                    ->whereIn(
                        'MaVoucherKhachHang',
                        $voucherIds
                    )
                    ->where('TrangThai', 'DaSuDung')
                    ->update([
                        'TrangThai' => 'ChuaSuDung',
                        'NgaySuDung' => null,
                    ]);
            }

            $diemDaThuHoi = 0;

            if (
                $hoaDon->MaKhachHang
                && (int) $hoaDon->DiemTichLuy > 0
            ) {
                $khachHang = KhachHang::query()
                    ->where(
                        'MaKhachHang',
                        $hoaDon->MaKhachHang
                    )
                    ->lockForUpdate()
                    ->first();

                if ($khachHang) {
                    $diemDaThuHoi =
                        (int) $hoaDon->DiemTichLuy;

                    /*
                     * Chỉ thu hồi điểm đã cộng.
                     * Không tự hạ hạng thành viên.
                     */
                    $this->diemService->hoanDiem(
                        $khachHang,
                        $diemDaThuHoi,
                        $maHD
                    );
                }
            }

            $nhanVien = auth('nhanvien')->user();

            $hoaDon->TrangThai = 'DaHuy';

            /*
             * Các cột dưới đây cần tồn tại trong migration của nhánh Banner.
             */
            $hoaDon->LyDoHuy = trim($data['ly_do']);
            $hoaDon->ThoiGianHuy = now();
            $hoaDon->MaNhanVienHuy =
                $nhanVien?->MaNhanVien;

            $hoaDon->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' =>
                    'Đã hủy hóa đơn đã thanh toán.',

                'data' => [
                    'MaHoaDon' =>
                        $maHD,

                    'DiemDaThuHoi' =>
                        $diemDaThuHoi,

                    /*
                     * Giữ thêm tên cũ để frontend nhánh Banner không bị vỡ.
                     */
                    'DiemDaHoan' =>
                        $diemDaThuHoi,

                    'SoVoucherHoan' =>
                        $soVoucherHoan,

                    'LyDoHuy' =>
                        $hoaDon->LyDoHuy,
                ],
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể hủy hóa đơn đã thanh toán', [
                'invoice_id' => $maHD,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể hủy hóa đơn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Danh sách bàn đang phục vụ
    |--------------------------------------------------------------------------
    */

    public function banDangTreo()
    {
        $data = HoaDon::query()
            ->with([
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ])
            ->where('TrangThai', 'ChuaThanhToan')
            ->orderBy('NgayLap')
            ->orderBy('SoBan')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Danh sách hóa đơn
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $filters = $request->validate([
            'tu_ngay' => [
                'nullable',
                'date',
            ],

            'den_ngay' => [
                'nullable',
                'date',
            ],

            'trang_thai' => [
                'nullable',
                Rule::in([
                    'ChuaThanhToan',
                    'DaThanhToan',
                    'DaHuy',
                ]),
            ],

            'keyword' => [
                'nullable',
                'string',
                'max:100',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'between:1,100',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        if (
            !empty($filters['tu_ngay'])
            && !empty($filters['den_ngay'])
            && $filters['den_ngay'] < $filters['tu_ngay']
        ) {
            throw ValidationException::withMessages([
                'den_ngay' => [
                    'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
                ],
            ]);
        }

        $query = HoaDon::query()
            ->with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'nhanVien:MaNhanVien,HoTen',
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ]);

        if (!empty($filters['tu_ngay'])) {
            $query->whereDate(
                'NgayLap',
                '>=',
                $filters['tu_ngay']
            );
        }

        if (!empty($filters['den_ngay'])) {
            $query->whereDate(
                'NgayLap',
                '<=',
                $filters['den_ngay']
            );
        }

        if (!empty($filters['trang_thai'])) {
            $query->where(
                'TrangThai',
                $filters['trang_thai']
            );
        }

        $keyword = trim(
            (string) ($filters['keyword'] ?? '')
        );

        if ($keyword !== '') {
            $query->where(function ($searchQuery) use ($keyword) {
                $searchQuery
                    ->where(
                        'MaHoaDon',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'SoBan',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhereHas(
                        'khachHang',
                        function ($customerQuery) use ($keyword) {
                            $customerQuery
                                ->where(
                                    'HoTen',
                                    'like',
                                    "%{$keyword}%"
                                )
                                ->orWhere(
                                    'SoDienThoai',
                                    'like',
                                    "%{$keyword}%"
                                );
                        }
                    );
            });
        }

        $query
            ->orderByDesc('NgayLap')
            ->orderByRaw(
                'CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED) DESC'
            );

        $hoaDons = $query->paginate(
            $filters['per_page'] ?? 10
        );

        $tongDoanhThu = HoaDon::query()
            ->where('TrangThai', 'DaThanhToan')
            ->when(
                !empty($filters['tu_ngay']),
                fn($query) =>
                $query->whereDate(
                    'NgayLap',
                    '>=',
                    $filters['tu_ngay']
                )
            )
            ->when(
                !empty($filters['den_ngay']),
                fn($query) =>
                $query->whereDate(
                    'NgayLap',
                    '<=',
                    $filters['den_ngay']
                )
            )
            ->sum('TongTien');

        return response()->json([
            'success' => true,
            'data' => $hoaDons->items(),

            'pagination' => [
                'current_page' =>
                    $hoaDons->currentPage(),

                'last_page' =>
                    $hoaDons->lastPage(),

                'per_page' =>
                    $hoaDons->perPage(),

                'total' =>
                    $hoaDons->total(),
            ],

            'thong_ke' => [
                'tong_hoa_don' =>
                    $hoaDons->total(),

                'tong_doanh_thu' =>
                    (float) $tongDoanhThu,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Chi tiết hóa đơn
    |--------------------------------------------------------------------------
    */

    public function show(string $maHD)
    {
        $hoaDon = HoaDon::query()
            ->with([
                'chiTietHoaDon.loaiVe',
                'khachHang.hangThanhVien',
                'nhanVien:MaNhanVien,HoTen',
                'hangThanhVien:MaHangThanhVien,TenHang',
            ])
            ->find($maHD);

        if (!$hoaDon) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không tìm thấy hóa đơn.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $hoaDon,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Voucher helpers
    |--------------------------------------------------------------------------
    */

    private function normalizeVoucherIds(
        array $voucherIds
    ): Collection {
        return collect($voucherIds)
            ->map(
                fn($id) =>
                trim((string) $id)
            )
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * Lấy voucher hợp lệ và danh sách voucher không còn hợp lệ.
     *
     * @return array{
     *     0: Collection<int, VoucherKhachHang>,
     *     1: Collection<int, string>
     * }
     */
    private function loadAndValidateVouchers(
        Collection $requestedIds,
        string $customerId,
        bool $lock
    ): array {
        $voucherQuery = VoucherKhachHang::query()
            ->whereIn(
                'MaVoucherKhachHang',
                $requestedIds
            )
            ->orderBy('MaVoucherKhachHang');

        if ($lock) {
            $voucherQuery->lockForUpdate();
        }

        $voucherRows = $voucherQuery->get();

        $offerQuery = UuDai::query()
            ->whereIn(
                'MaUuDai',
                $voucherRows
                    ->pluck('MaUuDai')
                    ->unique()
            )
            ->orderBy('MaUuDai');

        if ($lock) {
            $offerQuery->lockForUpdate();
        }

        $offers = $offerQuery
            ->get()
            ->keyBy('MaUuDai');

        $today = now()->toDateString();

        $validVouchers = $voucherRows
            ->filter(
                function (VoucherKhachHang $voucher) use ($customerId, $offers, $today) {
                    $offer = $offers->get(
                        $voucher->MaUuDai
                    );

                    if (!$offer) {
                        return false;
                    }

                    $offerConHan =
                        !empty($offer->NgayBatDau)
                        && !empty($offer->NgayKetThuc)
                        && $offer->NgayBatDau <= $today
                        && $offer->NgayKetThuc >= $today;

                    $voucherConHan =
                        !empty($voucher->NgayHetHan)
                        && $voucher->NgayHetHan >= $today;

                    if (
                        $voucher->MaKhachHang !== $customerId
                        || $voucher->TrangThai !== 'ChuaSuDung'
                        || !$voucherConHan
                        || $offer->TrangThai !== 'HoatDong'
                        || !$offerConHan
                    ) {
                        return false;
                    }

                    $voucher->setRelation(
                        'uuDai',
                        $offer
                    );

                    return true;
                }
            )
            ->sort(
                function (VoucherKhachHang $left, VoucherKhachHang $right) {
                    $order =
                        (int) ($left->uuDai->ThuTuApDung ?? 1)
                        <=>
                        (int) ($right->uuDai->ThuTuApDung ?? 1);

                    return $order !== 0
                        ? $order
                        : strcmp(
                            $left->MaVoucherKhachHang,
                            $right->MaVoucherKhachHang
                        );
                }
            )
            ->values();

        $validIds = $validVouchers->pluck(
            'MaVoucherKhachHang'
        );

        $invalidIds = $requestedIds
            ->diff($validIds)
            ->values();

        return [
            $validVouchers,
            $invalidIds,
        ];
    }

    /**
     * Tính giảm giá voucher.
     *
     * - Điều kiện hóa đơn tối thiểu tính theo tổng gốc.
     * - Phần trăm tính theo số tiền còn lại.
     * - Voucher tiền/tặng món chỉ dùng nếu còn đủ tiền để dùng trọn giá trị.
     * - Voucher cùng nhóm chỉ dùng chung khi tất cả voucher liên quan cho phép.
     */
    private function tinhGiamGiaVoucher(
        Collection $vouchers,
        float $tongTienGoc
    ): array {
        $tongGiam = 0.0;
        $conLai = max(0, $tongTienGoc);

        $maVoucherApDung = [];
        $khongApDung = collect();

        $nhomDaSuDung = [];

        foreach ($vouchers as $voucher) {
            if ($conLai <= 0) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $uuDai = $voucher->uuDai;

            if (!$uuDai) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $nhom = (string) $uuDai->NhomUuDai;

            $coTheDungChung = in_array(
                $uuDai->CoTheDungChung,
                [
                    1,
                    '1',
                    true,
                ],
                true
            );

            if (
                array_key_exists(
                    $nhom,
                    $nhomDaSuDung
                )
                && (
                    !$nhomDaSuDung[$nhom]
                    || !$coTheDungChung
                )
            ) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $giaTriHoaDonToiThieu = (float) (
                $uuDai->GiaTriHoaDonToiThieu ?? 0
            );

            if (
                $giaTriHoaDonToiThieu > 0
                && $tongTienGoc < $giaTriHoaDonToiThieu
            ) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $giaTriGiam = (float) $uuDai->GiaTriGiam;

            if (
                $giaTriGiam <= 0
                || (
                    $nhom === 'PhanTram'
                    && $giaTriGiam > 100
                )
            ) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $giam = $nhom === 'PhanTram'
                ? $conLai * ($giaTriGiam / 100)
                : $giaTriGiam;

            /*
             * Voucher giảm tiền hoặc tặng món phải được dùng trọn giá trị.
             * Nếu phần tiền còn lại nhỏ hơn giá trị voucher thì giữ voucher.
             */
            if (
                $nhom !== 'PhanTram'
                && $giam > $conLai
            ) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $giam = min(
                $giam,
                $conLai
            );

            if ($giam <= 0) {
                $khongApDung->push(
                    $voucher->MaVoucherKhachHang
                );

                continue;
            }

            $tongGiam += $giam;
            $conLai -= $giam;

            $maVoucherApDung[] =
                $voucher->MaVoucherKhachHang;

            $nhomDaSuDung[$nhom] =
                ($nhomDaSuDung[$nhom] ?? true)
                && $coTheDungChung;
        }

        return [
            'tongGiam' => $tongGiam,

            'tongThanhToan' =>
                max(
                    0,
                    $tongTienGoc - $tongGiam
                ),

            'maVoucherApDung' =>
                $maVoucherApDung,

            'khongApDung' =>
                $khongApDung
                    ->unique()
                    ->values(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Tính điểm
    |--------------------------------------------------------------------------
    */

    private function tinhDiemHoaDon(
        ?KhachHang $khachHang,
        float $tongThanhToan
    ): array {
        $result = [
            'diemTichLuy' => 0,
            'maQuyTac' => null,
            'laSinhNhat' => false,
            'tenHang' => null,
            'quyTacInfo' => null,
        ];

        if (!$khachHang) {
            return $result;
        }

        $hangThanhVien = $khachHang->hangThanhVien;
        $quyTac = $hangThanhVien?->quyTac;

        $result['tenHang'] =
            $hangThanhVien?->TenHang;

        if (!$quyTac) {
            return $result;
        }

        $today = now()->toDateString();

        $quyTacDangApDung =
            $quyTac->TrangThai === 'HoatDong'
            && (
                !$quyTac->NgayApDung
                || $quyTac->NgayApDung <= $today
            )
            && (
                !$quyTac->NgayHetHan
                || $quyTac->NgayHetHan >= $today
            );

        if (!$quyTacDangApDung) {
            return $result;
        }

        $diemTichLuy = $this->diemService->tinhDiem(
            $quyTac,
            $tongThanhToan,
            $khachHang->NgaySinh
        );

        $laSinhNhat =
            (int) ($quyTac->NhanDoiSinhNhat ?? 0) === 1
            && $this->diemService->laSinhNhatHomNay(
                $khachHang->NgaySinh
            );

        $soTienQuyDoi = (float) $quyTac->SoTienQuyDoi;

        $diemCoBan = $soTienQuyDoi > 0
            ? (int) floor(
                $tongThanhToan / $soTienQuyDoi
            ) * (int) $quyTac->SoDiemNhan
            : 0;

        $mucToiThieu = (float) (
            $quyTac->GiaTriHoaDonToiThieu ?? 0
        );

        $heSo = (float) (
            $quyTac->HeSoNhanDiem ?? 1
        );

        $apDungHeSo =
            $mucToiThieu > 0
            && $tongThanhToan >= $mucToiThieu
            && $heSo > 1;

        return [
            'diemTichLuy' =>
                (int) ($diemTichLuy['diem'] ?? 0),

            'maQuyTac' =>
                $quyTac->MaQuyTac,

            'laSinhNhat' =>
                $laSinhNhat,

            'tenHang' =>
                $hangThanhVien?->TenHang,

            'quyTacInfo' => [
                'MaQuyTac' =>
                    $quyTac->MaQuyTac,

                'SoTienQuyDoi' =>
                    (float) $quyTac->SoTienQuyDoi,

                'SoDiemNhan' =>
                    (int) $quyTac->SoDiemNhan,

                'GiaTriHoaDonToiThieu' =>
                    $mucToiThieu,

                'HeSoNhanDiem' =>
                    $heSo,

                'ApDungHeSo' =>
                    $apDungHeSo,

                'NhanDoiSinhNhat' =>
                    (bool) ($quyTac->NhanDoiSinhNhat ?? false),

                'DiemCoBan' =>
                    $diemCoBan,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers hóa đơn và vé
    |--------------------------------------------------------------------------
    */

    private function tinhTongTienGoc(
        string $maHD
    ): float {
        return (float) ChiTietHoaDon::query()
            ->where('MaHoaDon', $maHD)
            ->get()
            ->sum(
                fn($chiTiet) =>
                (float) $chiTiet->DonGia
                * (int) $chiTiet->SoLuong
            );
    }

    private function veHopLeThoiDiemNay(
        LoaiVe $ve
    ): bool {
        $now = now();

        $laCuoiTuan = in_array(
            $now->dayOfWeek,
            [
                0,
                6,
            ],
            true
        );

        $loaiNgayHienTai =
            $laCuoiTuan
            ? 'CuoiTuan'
            : 'NgayThuong';

        $buoiHienTai =
            $now->hour < 16
            ? 'Trua'
            : 'Toi';

        return
            $ve->LoaiNgay === $loaiNgayHienTai
            && $ve->BuoiAn === $buoiHienTai;
    }

    /**
     * Lỗi unique index chống hai hóa đơn mở trên cùng một bàn.
     */
    private function laLoiTrungBan(
        \Throwable $exception
    ): bool {
        return
            $exception instanceof QueryException
            && str_contains(
                $exception->getMessage(),
                'hoadon_soban_dangmo_unique'
            );
    }

    /**
     * Cảnh báo cho nhân viên khi mở/đổi bàn cho khách vãng lai nếu đúng bàn
     * đó đã được gán cho một lượt đặt bàn trước sắp tới (Đã xác nhận) —
     * mở/đổi bàn KHÔNG bị chặn, chỉ cảnh báo để nhân viên chủ động trả bàn
     * đúng giờ hoặc sắp xếp bàn khác cho khách đặt trước.
     *
     * Mốc "sắp tới" dùng chung ThoiLuongPhucVuPhut với công thức tính bàn
     * còn trống phía đặt bàn, để nhất quán với cách hệ thống ước lượng thời
     * gian một lượt khách vãng lai sẽ ngồi.
     */
    private function canhBaoDatBanSapToi(string $maBan): ?array
    {
        $thoiLuongPhut = (int) (
            CauHinhDatBan::query()->value('ThoiLuongPhucVuPhut') ?? 120
        );

        $datBan = DatBan::query()
            ->with('khachHang:MaKhachHang,HoTen')
            ->where('MaBan', $maBan)
            ->where('TrangThai', 'DaXacNhan')
            ->where('ThoiGianDat', '>=', now())
            ->where('ThoiGianDat', '<=', now()->addMinutes($thoiLuongPhut))
            ->orderBy('ThoiGianDat')
            ->first();

        if (!$datBan) {
            return null;
        }

        return [
            'MaDatBan' => $datBan->MaDatBan,
            'ThoiGianDat' => $datBan->ThoiGianDat,
            'TenKhachHang' => $datBan->khachHang->HoTen ?? null,
            'SoLuongKhach' => $datBan->SoLuongKhach,
            'ThongDiep' => sprintf(
                'Bàn này đã được đặt trước lúc %s%s. Vui lòng trả bàn trước giờ đó hoặc sắp xếp bàn khác cho khách đặt trước.',
                $datBan->ThoiGianDat->format('H:i'),
                $datBan->khachHang?->HoTen ? " (khách: {$datBan->khachHang->HoTen})" : ''
            ),
        ];
    }
}
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
use App\Models\UuDai;
use App\Models\VoucherKhachHang;
use App\Services\DiemTichLuyService;
use App\Services\SequentialCodeService;
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
        private SequentialCodeService $codes
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
            'chi_tiet'             => 'required|array|min:1|max:50',
            'chi_tiet.*.MaLoaiVe'  => 'required|string|max:20|distinct|exists:loaive,MaLoaiVe',
            'chi_tiet.*.SoLuong'   => 'required|integer|min:1|max:100',
            'ma_khach_hang'        => 'nullable|string|max:20|exists:khachhang,MaKhachHang',
            'vouchers_ap_dung'     => 'nullable|array|max:10',
            'vouchers_ap_dung.*'   => 'string|max:20|distinct|exists:voucherkhachhang,MaVoucherKhachHang',
        ]);

        DB::beginTransaction();
        try {
            // Mọi luồng mở bàn đều khóa cùng một tập loại vé theo cùng thứ tự.
            // Ngoài việc lấy giá nhất quán, đây là mutex bằng row-lock giúp hai
            // request không thể đồng thời tạo hóa đơn treo cho cùng một bàn,
            // kể cả khi bàn đó chưa có dòng hóa đơn nào để lock.
            $ticketTypes = LoaiVe::query()
                ->orderBy('MaLoaiVe')
                ->lockForUpdate()
                ->get()
                ->keyBy('MaLoaiVe');

            $daCo = HoaDon::where('SoBan', $request->so_ban)
                ->where('TrangThai', 'ChuaThanhToan')
                ->lockForUpdate()
                ->exists();

            if ($daCo) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$request->so_ban} đang có hóa đơn chưa thanh toán.",
                ], 422);
            }

            $nhanVien = auth('nhanvien')->user();

            $tongTienGoc = 0;
            $chiTietData = [];

            foreach ($request->chi_tiet as $item) {
                $loaiVe = $ticketTypes->get($item['MaLoaiVe']);
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
                ? KhachHang::where('MaKhachHang', $request->ma_khach_hang)
                    ->lockForUpdate()
                    ->first()
                : null;

            if ($khachHang && $khachHang->TrangThai !== 'HoatDong') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Tài khoản khách hàng đang bị khóa.',
                ], 422);
            }

            $requestedVoucherIds = collect($request->input('vouchers_ap_dung', []))
                ->map(fn ($id) => trim((string) $id))
                ->filter()
                ->unique()
                ->values();

            if ($requestedVoucherIds->isNotEmpty()) {
                if (!$khachHang) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Cần chọn khách hàng trước khi áp dụng voucher.',
                    ], 422);
                }

                [$validVouchers, $invalidVoucherIds] = $this->lockAndValidateVouchers(
                    $requestedVoucherIds,
                    $khachHang->MaKhachHang
                );
                $incompatibleVoucherIds = $this->findIncompatibleVoucherIds($validVouchers);

                $reservedVoucherIds = HoaDon::query()
                    ->where('MaKhachHang', $khachHang->MaKhachHang)
                    ->where('TrangThai', 'ChuaThanhToan')
                    ->whereNotNull('MaVoucher')
                    ->pluck('MaVoucher')
                    ->flatMap(fn ($ids) => explode(',', $ids))
                    ->map(fn ($id) => trim((string) $id))
                    ->filter()
                    ->unique();

                $alreadyReserved = $requestedVoucherIds->intersect($reservedVoucherIds)->values();
                if (
                    $invalidVoucherIds->isNotEmpty()
                    || $alreadyReserved->isNotEmpty()
                    || $incompatibleVoucherIds->isNotEmpty()
                ) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => $incompatibleVoucherIds->isNotEmpty()
                            ? 'Có voucher cùng nhóm không được phép dùng chung.'
                            : ($alreadyReserved->isNotEmpty()
                                ? 'Voucher đã được giữ cho một hóa đơn chưa thanh toán khác.'
                                : 'Có voucher không còn đủ điều kiện áp dụng.'),
                        'invalid_vouchers' => $invalidVoucherIds
                            ->merge($alreadyReserved)
                            ->merge($incompatibleVoucherIds)
                            ->unique()
                            ->values(),
                    ], 409);
                }
            }

            $maHD = $this->codes->next('hoadon', 'MaHoaDon', 'HD');

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
                    ? $requestedVoucherIds->implode(',')
                    : null,
                'SoBan'           => $request->so_ban,
            ]);

            $detailCodes = $this->codes->nextBatch(
                'chitiethoadon',
                'MaChiTietHD',
                'CTHD',
                count($chiTietData)
            );

            foreach ($chiTietData as $index => $ct) {
                ChiTietHoaDon::create([
                    'MaChiTietHD' => $detailCodes[$index],
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
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Không thể mở hóa đơn', [
                'staff_id' => auth('nhanvien')->id(),
                'table' => $request->so_ban,
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể mở hóa đơn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /* ==================================================================
     *  THANH TOÁN HÓA ĐƠN TREO
     * ================================================================== */
    public function thanhToan(Request $request, string $maHD)
    {
        $request->validate([
            'continue_without_invalid_vouchers' => ['sometimes', 'boolean'],
        ]);

        $hoaDon = HoaDon::find($maHD);

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
            // Đọc lại và khóa hóa đơn trong transaction. Request thanh toán thứ
            // hai sẽ chờ request đầu và nhìn thấy trạng thái đã cập nhật.
            $hoaDon = HoaDon::with('chiTietHoaDon')
                ->where('MaHoaDon', $maHD)
                ->lockForUpdate()
                ->first();

            if (!$hoaDon || $hoaDon->TrangThai !== 'ChuaThanhToan') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Hóa đơn này đã được thanh toán hoặc không hợp lệ.',
                ], 422);
            }

            $tongTienGoc = $hoaDon->chiTietHoaDon->sum(fn ($ct) => $ct->DonGia * $ct->SoLuong);

            $khachHang = $hoaDon->MaKhachHang
                ? KhachHang::with(['hangThanhVien.quyTac'])
                    ->where('MaKhachHang', $hoaDon->MaKhachHang)
                    ->lockForUpdate()
                    ->first()
                : null;

            $tongGiam      = 0;
            $maVoucherList = [];

            if (
                !$khachHang
                && $hoaDon->MaVoucher
                && !$request->boolean('continue_without_invalid_vouchers')
            ) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'code' => 'VOUCHERS_INVALID',
                    'message' => 'Hóa đơn có voucher nhưng không còn thông tin khách hàng hợp lệ.',
                    'invalid_vouchers' => collect(explode(',', $hoaDon->MaVoucher))
                        ->map(fn ($id) => trim((string) $id))
                        ->filter()
                        ->values(),
                ], 409);
            }

            if ($khachHang && $hoaDon->MaVoucher) {
                $requestedVoucherIds = collect(explode(',', $hoaDon->MaVoucher))
                    ->map(fn ($id) => trim($id))
                    ->filter()
                    ->unique()
                    ->values();

                [$vouchers, $invalidVoucherIds] = $this->lockAndValidateVouchers(
                    $requestedVoucherIds,
                    $khachHang->MaKhachHang
                );
                $incompatibleVoucherIds = $this->findIncompatibleVoucherIds($vouchers);
                $unavailableVoucherIds = $invalidVoucherIds
                    ->merge($incompatibleVoucherIds)
                    ->unique()
                    ->values();

                if (
                    $unavailableVoucherIds->isNotEmpty()
                    && !$request->boolean('continue_without_invalid_vouchers')
                ) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'code' => 'VOUCHERS_INVALID',
                        'message' => 'Một số voucher không còn hiệu lực hoặc không thể dùng chung. Hãy xác nhận số tiền trước khi thanh toán tiếp.',
                        'invalid_vouchers' => $unavailableVoucherIds,
                    ], 409);
                }

                $nhomDaSuDung = [];
                foreach ($vouchers as $v) {
                    // Đã giảm hết mức (bằng tổng tiền) thì dừng, các voucher sau không áp nữa
                    if ($tongGiam >= $tongTienGoc) {
                        break;
                    }

                    $nhom = $v->uuDai->NhomUuDai;
                    $coTheDungChung = in_array($v->uuDai->CoTheDungChung, [1, '1', true], true);
                    if (
                        array_key_exists($nhom, $nhomDaSuDung)
                        && (!$nhomDaSuDung[$nhom] || !$coTheDungChung)
                    ) {
                        continue;
                    }

                    // Số tiền giảm của voucher này
                    $giamVoucher = $v->uuDai->NhomUuDai === 'PhanTram'
                        ? $tongTienGoc * ($v->uuDai->GiaTriGiam / 100)
                        : $v->uuDai->GiaTriGiam;

                    // Không cho giảm quá phần tiền còn lại (tránh hóa đơn âm)
                    $conLai      = $tongTienGoc - $tongGiam;
                    $giamVoucher = min($giamVoucher, $conLai);

                    if ($giamVoucher <= 0) {
                        continue;
                    }

                    $tongGiam += $giamVoucher;
                    $nhomDaSuDung[$nhom] = ($nhomDaSuDung[$nhom] ?? true) && $coTheDungChung;
                    $maVoucherList[]     = $v->MaVoucherKhachHang;
                }
            }

            $tongThanhToan = max(0, $tongTienGoc - $tongGiam);

            $diemTichLuy = 0;
            $maQuyTac    = null;

            if ($khachHang) {
                $quyTac = $khachHang->hangThanhVien->quyTac ?? null;
                $today = now()->toDateString();
                $quyTacDangApDung = $quyTac
                    && $quyTac->TrangThai === 'HoatDong'
                    && (!$quyTac->NgayApDung || $quyTac->NgayApDung <= $today)
                    && (!$quyTac->NgayHetHan || $quyTac->NgayHetHan >= $today);

                if ($quyTacDangApDung) {
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
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Không thể thanh toán hóa đơn', [
                'invoice_id' => $maHD,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể thanh toán hóa đơn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /**
     * Khóa toàn bộ voucher và ưu đãi liên quan rồi kiểm tra lại điều kiện tại
     * thời điểm thao tác. Trả về voucher hợp lệ theo thứ tự áp dụng ổn định và
     * danh sách mã không hợp lệ để caller không âm thầm thay đổi số tiền.
     *
     * @param Collection<int, string> $requestedIds
     * @return array{0: Collection<int, VoucherKhachHang>, 1: Collection<int, string>}
     */
    private function lockAndValidateVouchers(Collection $requestedIds, string $customerId): array
    {
        $voucherRows = VoucherKhachHang::query()
            ->whereIn('MaVoucherKhachHang', $requestedIds)
            ->orderBy('MaVoucherKhachHang')
            ->lockForUpdate()
            ->get();

        $offers = UuDai::query()
            ->whereIn('MaUuDai', $voucherRows->pluck('MaUuDai')->unique())
            ->orderBy('MaUuDai')
            ->lockForUpdate()
            ->get()
            ->keyBy('MaUuDai');

        $today = now()->toDateString();
        $validVouchers = $voucherRows
            ->filter(function ($voucher) use ($customerId, $offers, $today) {
                $offer = $offers->get($voucher->MaUuDai);
                if (!$offer) return false;

                $isOfferInDateRange = !empty($offer->NgayBatDau)
                    && !empty($offer->NgayKetThuc)
                    && $offer->NgayBatDau <= $today
                    && $offer->NgayKetThuc >= $today;

                $isVoucherInDateRange = !empty($voucher->NgayHetHan)
                    && $voucher->NgayHetHan >= $today;

                if (
                    $voucher->MaKhachHang !== $customerId
                    || $voucher->TrangThai !== 'ChuaSuDung'
                    || !$isVoucherInDateRange
                    || $offer->TrangThai !== 'HoatDong'
                    || !$isOfferInDateRange
                ) {
                    return false;
                }

                $voucher->setRelation('uuDai', $offer);
                return true;
            })
            ->sort(function ($left, $right) {
                $order = ((int) $left->uuDai->ThuTuApDung)
                    <=> ((int) $right->uuDai->ThuTuApDung);

                return $order !== 0
                    ? $order
                    : strcmp($left->MaVoucherKhachHang, $right->MaVoucherKhachHang);
            })
            ->values();

        $validIds = $validVouchers->pluck('MaVoucherKhachHang');
        $invalidIds = $requestedIds->diff($validIds)->values();

        return [$validVouchers, $invalidIds];
    }

    /** @return Collection<int, string> */
    private function findIncompatibleVoucherIds(Collection $vouchers): Collection
    {
        $groupShareability = [];
        $incompatibleIds = collect();

        foreach ($vouchers as $voucher) {
            $group = $voucher->uuDai->NhomUuDai;
            $isShareable = in_array(
                $voucher->uuDai->CoTheDungChung,
                [1, '1', true],
                true
            );

            if (
                array_key_exists($group, $groupShareability)
                && (!$groupShareability[$group] || !$isShareable)
            ) {
                $incompatibleIds->push($voucher->MaVoucherKhachHang);
                continue;
            }

            $groupShareability[$group] = ($groupShareability[$group] ?? true)
                && $isShareable;
        }

        return $incompatibleIds->values();
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
        $filters = $request->validate([
            'tu_ngay' => ['nullable', 'date'],
            'den_ngay' => ['nullable', 'date'],
            'trang_thai' => ['nullable', Rule::in(['ChuaThanhToan', 'DaThanhToan', 'DaHuy'])],
            'keyword' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if (
            !empty($filters['tu_ngay'])
            && !empty($filters['den_ngay'])
            && $filters['den_ngay'] < $filters['tu_ngay']
        ) {
            throw ValidationException::withMessages([
                'den_ngay' => ['Ngày kết thúc phải từ ngày bắt đầu trở đi.'],
            ]);
        }

        $query = HoaDon::with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'nhanVien:MaNhanVien,HoTen',
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ])
            ->orderBy('NgayLap', 'desc')
            ->orderByRaw('CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED) DESC');

        if (!empty($filters['tu_ngay'])) {
            $query->whereDate('NgayLap', '>=', $filters['tu_ngay']);
        }
        if (!empty($filters['den_ngay'])) {
            $query->whereDate('NgayLap', '<=', $filters['den_ngay']);
        }
        if (!empty($filters['trang_thai'])) {
            $query->where('TrangThai', $filters['trang_thai']);
        }
        if ($kw = trim((string) ($filters['keyword'] ?? ''))) {
            $query->where(function ($searchQuery) use ($kw) {
                $searchQuery->where('MaHoaDon', 'like', "%{$kw}%")
                    ->orWhere('SoBan', 'like', "%{$kw}%")
                    ->orWhereHas('khachHang', fn ($customerQuery) =>
                        $customerQuery->where('HoTen', 'like', "%{$kw}%")
                            ->orWhere('SoDienThoai', 'like', "%{$kw}%")
                    );
            });
        }

        $hoaDons = $query->paginate($filters['per_page'] ?? 10);

        $tongDoanhThu = HoaDon::where('TrangThai', 'DaThanhToan')
            ->when(!empty($filters['tu_ngay']),  fn ($q) => $q->whereDate('NgayLap', '>=', $filters['tu_ngay']))
            ->when(!empty($filters['den_ngay']), fn ($q) => $q->whereDate('NgayLap', '<=', $filters['den_ngay']))
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

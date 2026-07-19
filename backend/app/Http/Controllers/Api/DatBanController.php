<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BanAn;
use App\Models\CauHinhDatBan;
use App\Models\DatBan;
use App\Services\SequentialCodeService;
use App\Services\ThongBaoService;
use App\Services\VnPayService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Đặt bàn trước — phía khách hàng (guard member).
 *
 * Giữ chỗ theo tổng sức chứa của khung giờ (ngày + buổi), KHÔNG khóa một
 * bàn cụ thể lúc đặt — nhân viên gán bàn cụ thể ở bước xác nhận
 * (StaffDatBanController::xacNhan).
 */
class DatBanController extends Controller
{
    private const TRANG_THAI_DANG_HOAT_DONG = [
        'ChoThanhToanCoc',
        'ChoXacNhan',
        'DaXacNhan',
    ];

    private const TRANG_THAI_DANG_GIU_CHO = [
        'ChoXacNhan',
        'DaXacNhan',
        'DaNhanBan',
    ];

    public function __construct(
        private SequentialCodeService $codes,
        private ThongBaoService $thongBao,
        private VnPayService $vnPay
    ) {}

    public function khungGioTrong(Request $request)
    {
        $data = $request->validate([
            'ngay' => ['required', 'date', 'after_or_equal:today'],
            'gio' => ['required', 'date_format:H:i'],
            'so_khach' => ['required', 'integer', 'min:1', 'max:200'],
        ]);

        $cauHinh = $this->layCauHinh();
        $buoi = $this->xacDinhBuoi($data['gio']);

        if (!$buoi) {
            return response()->json([
                'success' => false,
                'message' => 'Giờ đặt phải nằm trong khung phục vụ (10:00–15:59 buổi trưa hoặc 16:00–21:59 buổi tối).',
            ], 422);
        }

        $loi = $this->kiemTraDieuKienDat($data['ngay'], $data['gio'], (int) $data['so_khach'], $cauHinh);

        if ($loi) {
            return response()->json(['success' => false, 'message' => $loi], 422);
        }

        $tongSucChua = (int) BanAn::query()->where('TrangThai', 'HoatDong')->sum('SucChua');
        $daGiu = $this->soKhachDangGiu($data['ngay'], $buoi, $cauHinh);
        $sucChuaConLai = max(0, $tongSucChua - $daGiu);

        return response()->json([
            'success' => true,
            'data' => [
                'BuoiAn' => $buoi,
                'SucChuaConLai' => $sucChuaConLai,
                'ConTrong' => $sucChuaConLai >= (int) $data['so_khach'],
                'TienCocDuKien' => (int) $data['so_khach'] * (float) $cauHinh->MucCocMoiKhach,
                'CauHinh' => [
                    'SoKhachToiThieu' => (int) $cauHinh->SoKhachToiThieu,
                    'SoKhachToiDa' => (int) $cauHinh->SoKhachToiDa,
                    'SoGioDatToiThieu' => (int) $cauHinh->SoGioDatToiThieu,
                    'MucCocMoiKhach' => (float) $cauHinh->MucCocMoiKhach,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'ngay' => ['required', 'date', 'after_or_equal:today'],
            'gio' => ['required', 'date_format:H:i'],
            'so_khach' => ['required', 'integer', 'min:1', 'max:200'],
            'ghi_chu' => ['nullable', 'string', 'max:500'],
        ]);

        $khachHang = auth('khachhang')->user();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không xác định được tài khoản khách hàng.',
            ], 401);
        }

        $cauHinh = $this->layCauHinh();
        $buoi = $this->xacDinhBuoi($data['gio']);

        if (!$buoi) {
            return response()->json([
                'success' => false,
                'message' => 'Giờ đặt phải nằm trong khung phục vụ (10:00–15:59 buổi trưa hoặc 16:00–21:59 buổi tối).',
            ], 422);
        }

        $loi = $this->kiemTraDieuKienDat($data['ngay'], $data['gio'], (int) $data['so_khach'], $cauHinh);

        if ($loi) {
            return response()->json(['success' => false, 'message' => $loi], 422);
        }

        $coLuotDangHoatDong = DatBan::query()
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->whereIn('TrangThai', self::TRANG_THAI_DANG_HOAT_DONG)
            ->exists();

        if ($coLuotDangHoatDong) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đang có một lượt đặt bàn khác chưa hoàn tất. Vui lòng hoàn tất hoặc hủy lượt đó trước khi đặt thêm.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            /*
             * Khóa toàn bộ banan đang hoạt động + các datban đang giữ chỗ
             * cùng ngày/buổi để đọc sức chứa nhất quán trong transaction.
             */
            $tongSucChua = (int) BanAn::query()
                ->where('TrangThai', 'HoatDong')
                ->lockForUpdate()
                ->sum('SucChua');

            $daGiu = $this->soKhachDangGiu($data['ngay'], $buoi, $cauHinh, true);

            if ($tongSucChua - $daGiu < (int) $data['so_khach']) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Khung giờ này không còn đủ chỗ trống. Vui lòng chọn khung giờ khác.',
                ], 422);
            }

            $maDatBan = $this->codes->next('datban', 'MaDatBan', 'DB');
            $thoiGianDat = Carbon::parse("{$data['ngay']} {$data['gio']}");

            $datBan = DatBan::create([
                'MaDatBan' => $maDatBan,
                'MaKhachHang' => $khachHang->MaKhachHang,
                'ThoiGianDat' => $thoiGianDat,
                'BuoiAn' => $buoi,
                'SoLuongKhach' => $data['so_khach'],
                'TrangThai' => 'ChoThanhToanCoc',
                'TrangThaiCoc' => 'ChuaThanhToan',
                'SoTienCoc' => (int) $data['so_khach'] * (float) $cauHinh->MucCocMoiKhach,
                'GhiChu' => $data['ghi_chu'] ?? null,
                'ThoiGianTao' => now(),
            ]);

            DB::commit();

            /*
             * Build URL thanh toán SAU khi commit — nếu gọi trong transaction
             * mà transaction rollback sau đó, sẽ tạo URL cho một đặt bàn
             * không tồn tại.
             */
            $paymentUrl = $this->vnPay->buildPaymentUrl(
                $maDatBan,
                (int) round($datBan->SoTienCoc),
                $request->ip(),
                "Coc dat ban {$maDatBan}",
                now()->addMinutes((int) $cauHinh->ThoiGianGiuChoPhut)
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã giữ chỗ tạm thời. Vui lòng hoàn tất thanh toán cọc trong ' . $cauHinh->ThoiGianGiuChoPhut . ' phút để giữ lượt đặt.',
                'data' => $datBan,
                'payment_url' => $paymentUrl,
            ], 201);
        } catch (\Throwable $exception) {
            DB::rollBack();

            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo lượt đặt bàn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $khachHang = auth('khachhang')->user();

        $filters = $request->validate([
            'trang_thai' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DatBan::query()
            ->with(['banAn:MaBan,TenBan,KhuVuc'])
            ->where('MaKhachHang', $khachHang->MaKhachHang);

        if (!empty($filters['trang_thai'])) {
            $query->where('TrangThai', $filters['trang_thai']);
        }

        $query->orderByDesc('ThoiGianTao');

        $paginator = $query->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $ma)
    {
        $khachHang = auth('khachhang')->user();

        $datBan = DatBan::query()
            ->with(['banAn:MaBan,TenBan,KhuVuc'])
            ->where('MaDatBan', $ma)
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->first();

        if (!$datBan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy lượt đặt bàn.',
            ], 404);
        }

        $coTheHuy = in_array($datBan->TrangThai, self::TRANG_THAI_DANG_HOAT_DONG, true);

        $hoanCocNeuHuyNgay = null;

        if ($coTheHuy) {
            $cauHinh = $this->layCauHinh();
            $hoanCocNeuHuyNgay = $this->tinhHoanTienKhiHuy($datBan, $cauHinh);
        }

        return response()->json([
            'success' => true,
            'data' => $datBan,
            'hoan_coc_neu_huy_ngay' => $hoanCocNeuHuyNgay,
        ]);
    }

    public function huy(Request $request, string $ma)
    {
        $khachHang = auth('khachhang')->user();

        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $ma)
                ->where('MaKhachHang', $khachHang->MaKhachHang)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy lượt đặt bàn.',
                ], 404);
            }

            if (!in_array($datBan->TrangThai, self::TRANG_THAI_DANG_HOAT_DONG, true)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Lượt đặt bàn này không thể hủy ở trạng thái hiện tại.',
                ], 422);
            }

            $cauHinh = $this->layCauHinh();
            $trangThaiCocMoi = $this->tinhTrangThaiCocKhiHuy($datBan, $cauHinh);
            $hoanTien = $this->tinhHoanTienKhiHuy($datBan, $cauHinh);
            $canNhapNganHang = $hoanTien['TrangThaiHoanTien'] === 'ChoXuLy';

            $validator = Validator::make($request->all(), [
                'ngan_hang' => [$canNhapNganHang ? 'required' : 'nullable', 'string', 'max:100'],
                'so_tai_khoan' => [$canNhapNganHang ? 'required' : 'nullable', 'string', 'max:50'],
                'ten_chu_tai_khoan' => [$canNhapNganHang ? 'required' : 'nullable', 'string', 'max:100'],
            ], [
                'ngan_hang.required' => 'Vui lòng chọn ngân hàng để nhận hoàn cọc.',
                'so_tai_khoan.required' => 'Vui lòng nhập số tài khoản để nhận hoàn cọc.',
                'ten_chu_tai_khoan.required' => 'Vui lòng nhập tên chủ tài khoản để nhận hoàn cọc.',
            ]);

            if ($validator->fails()) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                    'can_nhap_ngan_hang' => $canNhapNganHang,
                    'so_tien_hoan_du_kien' => $hoanTien['SoTienHoan'],
                ], 422);
            }

            $validated = $validator->validated();

            $datBan->TrangThai = 'DaHuy';
            $datBan->TrangThaiCoc = $trangThaiCocMoi;
            $datBan->SoTienHoan = $hoanTien['SoTienHoan'];
            $datBan->TrangThaiHoanTien = $hoanTien['TrangThaiHoanTien'];
            $datBan->ThoiGianHuy = now();
            $datBan->LyDoTuChoiHuy = 'Khách tự hủy.';

            if ($canNhapNganHang) {
                $datBan->NganHangHoanTien = $validated['ngan_hang'];
                $datBan->SoTaiKhoanHoanTien = $validated['so_tai_khoan'];
                $datBan->TenChuTaiKhoanHoanTien = $validated['ten_chu_tai_khoan'];
            }

            $datBan->save();

            $noiDungThongBao = $canNhapNganHang
                ? "Lượt đặt bàn {$ma} đã được hủy. Bạn sẽ được hoàn "
                    . number_format((float) $hoanTien['SoTienHoan'], 0, ',', '.')
                    . "đ trong vòng 24 giờ qua tài khoản đã cung cấp."
                : "Lượt đặt bàn {$ma} đã được hủy theo yêu cầu của bạn.";

            $this->thongBao->gui(
                $khachHang->MaKhachHang,
                'Đã hủy lượt đặt bàn',
                $noiDungThongBao
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã hủy lượt đặt bàn.',
                'data' => $datBan,
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Không thể hủy lượt đặt bàn lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /**
     * Xác định buổi (Trua/Toi) từ giờ HH:mm, null nếu ngoài khung phục vụ.
     */
    private function xacDinhBuoi(string $gio): ?string
    {
        $gio_hour = (int) explode(':', $gio)[0];

        if ($gio_hour >= 10 && $gio_hour < 16) {
            return 'Trua';
        }

        if ($gio_hour >= 16 && $gio_hour < 22) {
            return 'Toi';
        }

        return null;
    }

    private function kiemTraDieuKienDat(string $ngay, string $gio, int $soKhach, CauHinhDatBan $cauHinh): ?string
    {
        if ($soKhach < (int) $cauHinh->SoKhachToiThieu || $soKhach > (int) $cauHinh->SoKhachToiDa) {
            return "Số khách phải từ {$cauHinh->SoKhachToiThieu} đến {$cauHinh->SoKhachToiDa} người.";
        }

        $thoiGianDat = Carbon::parse("{$ngay} {$gio}");

        if ($thoiGianDat->lt(now()->addHours((int) $cauHinh->SoGioDatToiThieu))) {
            return "Vui lòng đặt trước ít nhất {$cauHinh->SoGioDatToiThieu} giờ so với giờ dự kiến đến.";
        }

        return null;
    }

    /**
     * Tổng số khách đang giữ chỗ trong cùng ngày + buổi.
     *
     * ChoThanhToanCoc chỉ tính nếu còn trong hạn giữ chỗ (chưa hết
     * ThoiGianGiuChoPhut phút kể từ ThoiGianTao) — quá hạn coi như chưa
     * từng giữ chỗ, cron sẽ dọn các bản ghi này sau.
     */
    private function soKhachDangGiu(string $ngay, string $buoi, CauHinhDatBan $cauHinh, bool $lock = false): int
    {
        $query = DatBan::query()
            ->whereDate('ThoiGianDat', $ngay)
            ->where('BuoiAn', $buoi)
            ->where(function ($q) use ($cauHinh) {
                $q->whereIn('TrangThai', self::TRANG_THAI_DANG_GIU_CHO)
                    ->orWhere(function ($q2) use ($cauHinh) {
                        $q2->where('TrangThai', 'ChoThanhToanCoc')
                            ->where('ThoiGianTao', '>', now()->subMinutes((int) $cauHinh->ThoiGianGiuChoPhut));
                    });
            });

        if ($lock) {
            $query->lockForUpdate();
        }

        return (int) $query->sum('SoLuongKhach');
    }

    private function tinhTrangThaiCocKhiHuy(DatBan $datBan, CauHinhDatBan $cauHinh): string
    {
        if ($datBan->TrangThaiCoc !== 'DaThanhToan') {
            return $datBan->TrangThaiCoc;
        }

        $soGioConLai = now()->diffInHours($datBan->ThoiGianDat, false);

        if ($soGioConLai >= (int) $cauHinh->SoGioHuyMienPhi) {
            return 'DaHoanToanBo';
        }

        if ($soGioConLai >= (int) $cauHinh->SoGioHuyMotPhan) {
            return 'DaHoanMotPhan';
        }

        return 'DaMat';
    }

    /**
     * Số tiền hoàn + trạng thái xử lý hoàn tiền dựa trên số giờ còn lại tới
     * giờ hẹn, dùng chung cho cả preview (show) và hủy thật (huy). Chỉ áp
     * dụng khi cọc đã thanh toán — chưa thanh toán thì không có gì để hoàn.
     *
     * @return array{SoTienHoan: float, TrangThaiHoanTien: string}
     */
    private function tinhHoanTienKhiHuy(DatBan $datBan, CauHinhDatBan $cauHinh): array
    {
        if ($datBan->TrangThaiCoc !== 'DaThanhToan') {
            return ['SoTienHoan' => 0.0, 'TrangThaiHoanTien' => 'KhongApDung'];
        }

        $soGioConLai = now()->diffInHours($datBan->ThoiGianDat, false);

        if ($soGioConLai >= (int) $cauHinh->SoGioHuyMienPhi) {
            return ['SoTienHoan' => (float) $datBan->SoTienCoc, 'TrangThaiHoanTien' => 'ChoXuLy'];
        }

        if ($soGioConLai >= (int) $cauHinh->SoGioHuyMotPhan) {
            $soTienHoan = round((float) $datBan->SoTienCoc * ((int) $cauHinh->PhanTramHoanMotPhan / 100), 2);

            return ['SoTienHoan' => $soTienHoan, 'TrangThaiHoanTien' => 'ChoXuLy'];
        }

        return ['SoTienHoan' => 0.0, 'TrangThaiHoanTien' => 'KhongApDung'];
    }

    private function layCauHinh(): CauHinhDatBan
    {
        return CauHinhDatBan::query()->first() ?? new CauHinhDatBan([
            'ThoiGianGiuChoPhut' => 10,
            'SoGioDatToiThieu' => 2,
            'SoKhachToiThieu' => 2,
            'SoKhachToiDa' => 20,
            'PhutGiuBanSauGioHen' => 15,
            'MucCocMoiKhach' => 50000,
            'SoGioHuyMienPhi' => 6,
            'SoGioHuyMotPhan' => 2,
            'PhanTramHoanMotPhan' => 50,
        ]);
    }
}

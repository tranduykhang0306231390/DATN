<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BanAn;
use App\Models\CauHinhDatBan;
use App\Models\DatBan;
use App\Models\HoaDon;
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
 * Giữ chỗ theo SỐ BÀN thực tế còn trống tại đúng thời điểm khách chọn
 * (xem soBanDangBanTaiThoiDiem), KHÔNG còn gán cứng khung giờ Trưa/Tối
 * và KHÔNG khóa một bàn cụ thể lúc đặt — nhân viên gán bàn cụ thể ở bước
 * xác nhận (StaffDatBanController::xacNhan).
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
            'ngay' => ['required', 'date', $this->ruleNgayHopLe()],
            'gio' => ['required', 'date_format:H:i'],
            'so_khach' => ['required', 'integer', 'min:1', 'max:200'],
        ]);

        $cauHinh = $this->layCauHinh();
        $cauHinhOut = [
            'SoKhachToiThieu' => (int) $cauHinh->SoKhachToiThieu,
            'SoKhachToiDa' => (int) $cauHinh->SoKhachToiDa,
            'SoPhutDatToiThieu' => (int) $cauHinh->SoPhutDatToiThieu,
            'SoPhutDatToiThieuLabel' => $this->dinhDangPhut((int) $cauHinh->SoPhutDatToiThieu),
            'MucCocMoiKhach' => (float) $cauHinh->MucCocMoiKhach,
            'SoGioHuyMotPhan' => (int) $cauHinh->SoGioHuyMotPhan,
            'SoGioHuyMotPhanLabel' => $this->dinhDangPhut((int) $cauHinh->SoGioHuyMotPhan * 60),
        ];

        $buoi = $this->xacDinhBuoi($data['gio']);

        if (!$buoi) {
            return response()->json([
                'success' => false,
                'message' => 'Giờ đặt phải nằm trong giờ phục vụ của nhà hàng (10:00–21:59).',
                'cau_hinh' => $cauHinhOut,
            ], 422);
        }

        $loi = $this->kiemTraDieuKienDat($data['ngay'], $data['gio'], (int) $data['so_khach'], $cauHinh);

        if ($loi) {
            return response()->json([
                'success' => false,
                'message' => $loi,
                'cau_hinh' => $cauHinhOut,
            ], 422);
        }

        $thoiGianDat = Carbon::parse("{$data['ngay']} {$data['gio']}");
        $tongSoBan = (int) BanAn::query()->where('TrangThai', 'HoatDong')->count();
        $soBanDangBan = $this->soBanDangBanTaiThoiDiem($thoiGianDat, $cauHinh);
        $soBanConTrong = max(0, $tongSoBan - $soBanDangBan);
        $conTrong = $soBanConTrong >= 1;

        return response()->json([
            'success' => true,
            'data' => [
                'BuoiAn' => $buoi,
                'TongSoBan' => $tongSoBan,
                'SoBanConTrong' => $soBanConTrong,
                'ConTrong' => $conTrong,
                'TienCocDuKien' => (int) $data['so_khach'] * (float) $cauHinh->MucCocMoiKhach,
                'KhongHoanCocNeuDat' => $this->laDatSatGio(now(), $thoiGianDat, $cauHinh),
                'GoiYGioTrong' => $conTrong ? null : $this->timGioTrongGanNhat($thoiGianDat, $cauHinh, $tongSoBan),
                'CauHinh' => $cauHinhOut,
            ],
        ]);
    }

    /**
     * Khi khung giờ khách chọn đã hết bàn, quét tới (bước 15 phút) trong
     * đúng ngày đó tới giờ đóng cửa để tìm mốc giờ gần nhất còn ít nhất 1
     * bàn trống — trả kèm số phút/giờ nữa tính từ hiện tại để khách biết
     * "còn bao lâu nữa mới có bàn" thay vì phải tự dò từng giờ.
     */
    private function timGioTrongGanNhat(Carbon $tuThoiDiem, CauHinhDatBan $cauHinh, int $tongSoBan): ?array
    {
        if ($tongSoBan < 1) {
            return null;
        }

        $gioDongCua = $tuThoiDiem->copy()->setTime(22, 0);

        // Làm tròn lên mốc 15 phút kế tiếp, luôn SAU $tuThoiDiem (không lặp
        // lại đúng mốc vừa kiểm tra hết chỗ).
        $ung = $tuThoiDiem->copy()->addMinutes(15 - ($tuThoiDiem->minute % 15))->second(0);

        while ($ung->lt($gioDongCua)) {
            $soBanDangBan = $this->soBanDangBanTaiThoiDiem($ung, $cauHinh);

            if ($tongSoBan - $soBanDangBan >= 1) {
                $soPhutNua = max(0, (int) round(now()->diffInMinutes($ung, false)));

                return [
                    'Ngay' => $ung->toDateString(),
                    'Gio' => $ung->format('H:i'),
                    'SoPhutNua' => $soPhutNua,
                    'SoPhutNuaLabel' => $this->dinhDangPhut($soPhutNua),
                ];
            }

            $ung->addMinutes(15);
        }

        return null;
    }

    /**
     * Đặt bàn quá sát giờ hẹn (thời gian đặt trước ngắn hơn mốc "Hủy hoàn
     * một phần trước") thì không còn đủ khoảng thời gian để đạt bất kỳ bậc
     * hoàn cọc nào — chốt "không hoàn cọc" ngay từ lúc tạo lượt đặt, tránh
     * phụ thuộc cấu hình có thể đổi sau này.
     */
    private function laDatSatGio(Carbon $thoiGianTao, Carbon $thoiGianDat, CauHinhDatBan $cauHinh): bool
    {
        $phutDatTruoc = $thoiGianTao->diffInMinutes($thoiGianDat, false);

        return $phutDatTruoc < ((int) $cauHinh->SoGioHuyMotPhan * 60);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'ngay' => ['required', 'date', $this->ruleNgayHopLe()],
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
                'message' => 'Giờ đặt phải nằm trong giờ phục vụ của nhà hàng (10:00–21:59).',
            ], 422);
        }

        $loi = $this->kiemTraDieuKienDat($data['ngay'], $data['gio'], (int) $data['so_khach'], $cauHinh);

        if ($loi) {
            return response()->json(['success' => false, 'message' => $loi], 422);
        }

        /*
         * Tự dọn các lượt "Chờ thanh toán cọc" đã quá hạn giữ chỗ của
         * CHÍNH khách hàng này trước khi kiểm tra — tránh việc một lượt bị
         * bỏ dở (không thanh toán VNPay, đóng tab...) khóa vĩnh viễn tài
         * khoản nếu lệnh cron dọn dẹp định kỳ (datban:xu-ly-qua-han) không
         * chạy (ví dụ môi trường chưa cấu hình scheduler). Đây là nguyên
         * nhân khiến khách "bị kẹt", không đặt lại được nếu không tự hủy
         * thủ công lượt cũ.
         */
        DatBan::query()
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChoThanhToanCoc')
            ->where('ThoiGianTao', '<=', now()->subMinutes((int) $cauHinh->ThoiGianGiuChoPhut))
            ->update([
                'TrangThai' => 'DaHuy',
                'ThoiGianHuy' => now(),
                'LyDoTuChoiHuy' => 'Hết hạn thanh toán cọc.',
            ]);

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
            $thoiGianDat = Carbon::parse("{$data['ngay']} {$data['gio']}");

            /*
             * Khóa toàn bộ banan đang hoạt động + các datban/hoadon liên
             * quan để đếm số bàn còn trống nhất quán trong transaction.
             */
            $tongSoBan = (int) BanAn::query()
                ->where('TrangThai', 'HoatDong')
                ->lockForUpdate()
                ->count();

            $soBanDangBan = $this->soBanDangBanTaiThoiDiem($thoiGianDat, $cauHinh, true);

            if ($tongSoBan - $soBanDangBan < 1) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Thời điểm này không còn bàn trống. Vui lòng chọn thời gian khác.',
                ], 422);
            }

            $maDatBan = $this->codes->next('datban', 'MaDatBan', 'DB');
            $thoiGianTao = now();

            $datBan = DatBan::create([
                'MaDatBan' => $maDatBan,
                'MaKhachHang' => $khachHang->MaKhachHang,
                'ThoiGianDat' => $thoiGianDat,
                'BuoiAn' => $buoi,
                'SoLuongKhach' => $data['so_khach'],
                'TrangThai' => 'ChoThanhToanCoc',
                'TrangThaiCoc' => 'ChuaThanhToan',
                'KhongHoanCocDoDatSatGio' => $this->laDatSatGio($thoiGianTao, $thoiGianDat, $cauHinh),
                'SoTienCoc' => (int) $data['so_khach'] * (float) $cauHinh->MucCocMoiKhach,
                'GhiChu' => $data['ghi_chu'] ?? null,
                'ThoiGianTao' => $thoiGianTao,
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

    /**
     * Sinh lại URL thanh toán VNPay cho một lượt đặt đang "Chờ thanh toán
     * cọc" mà khách trót thoát ra giữa chừng — thay vì bắt khách phải hủy
     * rồi đặt lại từ đầu (mất chỗ, phải nhập lại thông tin).
     *
     * Không gia hạn thêm thời gian giữ chỗ: hạn thanh toán VNPay mới vẫn bị
     * chặn trong đúng phần thời gian giữ chỗ CÒN LẠI tính từ lúc tạo lượt
     * đặt ban đầu (ThoiGianTao), để nhất quán với cơ chế tự dọn ở store().
     */
    public function tiepTucThanhToan(Request $request, string $ma)
    {
        $khachHang = auth('khachhang')->user();

        $datBan = DatBan::query()
            ->where('MaDatBan', $ma)
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->first();

        if (!$datBan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy lượt đặt bàn.',
            ], 404);
        }

        if ($datBan->TrangThai !== 'ChoThanhToanCoc' || $datBan->TrangThaiCoc !== 'ChuaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Lượt đặt bàn này không còn ở trạng thái chờ thanh toán cọc.',
            ], 422);
        }

        $cauHinh = $this->layCauHinh();
        $hanGiuCho = $datBan->ThoiGianTao->copy()->addMinutes((int) $cauHinh->ThoiGianGiuChoPhut);
        $soPhutConLai = (int) floor(now()->diffInSeconds($hanGiuCho, false) / 60);

        if ($soPhutConLai < 1) {
            $datBan->update([
                'TrangThai' => 'DaHuy',
                'ThoiGianHuy' => now(),
                'LyDoTuChoiHuy' => 'Hết hạn thanh toán cọc.',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lượt đặt bàn này đã hết hạn giữ chỗ. Vui lòng đặt bàn mới.',
            ], 422);
        }

        $paymentUrl = $this->vnPay->buildPaymentUrl(
            $datBan->MaDatBan,
            (int) round($datBan->SoTienCoc),
            $request->ip(),
            "Coc dat ban {$datBan->MaDatBan}",
            now()->addMinutes($soPhutConLai)
        );

        return response()->json([
            'success' => true,
            'message' => "Bạn còn {$soPhutConLai} phút để hoàn tất thanh toán cọc.",
            'payment_url' => $paymentUrl,
        ]);
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

        if ($thoiGianDat->lt(now()->addMinutes((int) $cauHinh->SoPhutDatToiThieu))) {
            $nhan = $this->dinhDangPhut((int) $cauHinh->SoPhutDatToiThieu);

            return "Vui lòng đặt trước ít nhất {$nhan} so với giờ dự kiến đến.";
        }

        return null;
    }

    /**
     * Định dạng số phút thành nhãn tiếng Việt ngắn gọn: "45 phút",
     * "2 giờ", hoặc "1 giờ 30 phút" khi không tròn giờ.
     */
    private function dinhDangPhut(int $phut): string
    {
        if ($phut < 60) {
            return "{$phut} phút";
        }

        $gio = intdiv($phut, 60);
        $phutLe = $phut % 60;

        if ($phutLe === 0) {
            return "{$gio} giờ";
        }

        return "{$gio} giờ {$phutLe} phút";
    }

    /**
     * Số bàn đang bị chiếm tại thời điểm $thoiGianDat, ước lượng bằng cách
     * coi mỗi lượt giữ chỗ/hóa đơn đang mở chiếm đúng 1 bàn trong khoảng
     * [thời điểm bắt đầu, thời điểm bắt đầu + ThoiLuongPhucVuPhut]. Không
     * còn gán cứng khung giờ Trưa/Tối — chỉ so khoảng thời gian giao nhau
     * với đúng thời điểm khách yêu cầu.
     *
     * Gồm hai nguồn chiếm bàn:
     *  - Các lượt đặt bàn đang giữ chỗ (ChoXacNhan/DaXacNhan/DaNhanBan,
     *    hoặc ChoThanhToanCoc còn trong hạn giữ chỗ).
     *  - Khách vãng lai đang được phục vụ (hóa đơn Chưa thanh toán, không
     *    gắn với lượt đặt bàn nào) — tính từ lúc mở hóa đơn.
     */
    private function soBanDangBanTaiThoiDiem(Carbon $thoiGianDat, CauHinhDatBan $cauHinh, bool $lock = false): int
    {
        $thoiLuongPhut = (int) $cauHinh->ThoiLuongPhucVuPhut;
        $ketThucYeuCau = $thoiGianDat->copy()->addMinutes($thoiLuongPhut);
        $thoiGianDatStr = $thoiGianDat->toDateTimeString();
        $ketThucYeuCauStr = $ketThucYeuCau->toDateTimeString();

        $queryDatBan = DatBan::query()
            ->where(function ($q) use ($cauHinh) {
                $q->whereIn('TrangThai', self::TRANG_THAI_DANG_GIU_CHO)
                    ->orWhere(function ($q2) use ($cauHinh) {
                        $q2->where('TrangThai', 'ChoThanhToanCoc')
                            ->where('ThoiGianTao', '>', now()->subMinutes((int) $cauHinh->ThoiGianGiuChoPhut));
                    });
            })
            ->where('ThoiGianDat', '<', $ketThucYeuCauStr)
            ->whereRaw('DATE_ADD(ThoiGianDat, INTERVAL ? MINUTE) > ?', [$thoiLuongPhut, $thoiGianDatStr]);

        if ($lock) {
            $queryDatBan->lockForUpdate();
        }

        $soLuotDatBan = $queryDatBan->count();

        $queryKhachVangLai = HoaDon::query()
            ->where('TrangThai', 'ChuaThanhToan')
            ->whereNull('MaDatBan')
            ->where('NgayLap', '<', $ketThucYeuCauStr)
            ->whereRaw('DATE_ADD(NgayLap, INTERVAL ? MINUTE) > ?', [$thoiLuongPhut, $thoiGianDatStr]);

        if ($lock) {
            $queryKhachVangLai->lockForUpdate();
        }

        $soBanKhachVangLai = $queryKhachVangLai->count();

        return $soLuotDatBan + $soBanKhachVangLai;
    }

    /**
     * Chỉ cho phép đặt bàn cho hôm nay hoặc ngày mai — chặn ở backend để
     * tránh gian lận dù giao diện đã disable các ngày khác.
     */
    private function ruleNgayHopLe(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) {
            $ngayHopLe = [now()->toDateString(), now()->addDay()->toDateString()];

            if (!in_array($value, $ngayHopLe, true)) {
                $fail('Chỉ có thể đặt bàn cho hôm nay hoặc ngày mai.');
            }
        };
    }

    private function tinhTrangThaiCocKhiHuy(DatBan $datBan, CauHinhDatBan $cauHinh): string
    {
        if ($datBan->TrangThaiCoc !== 'DaThanhToan') {
            return $datBan->TrangThaiCoc;
        }

        if ($datBan->KhongHoanCocDoDatSatGio) {
            return 'DaMat';
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

        if ($datBan->KhongHoanCocDoDatSatGio) {
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
            'SoPhutDatToiThieu' => 120,
            'ThoiLuongPhucVuPhut' => 120,
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

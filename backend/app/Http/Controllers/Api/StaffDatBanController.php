<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\MoBanKhongThanhCongException;
use App\Http\Controllers\Controller;
use App\Models\BanAn;
use App\Models\DatBan;
use App\Services\MoBanService;
use App\Services\ThongBaoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Đặt bàn trước — phía nhân viên (guard staff).
 */
class StaffDatBanController extends Controller
{
    public function __construct(
        private MoBanService $moBanService,
        private ThongBaoService $thongBao
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'trang_thai' => ['nullable', 'string'],
            'ngay' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DatBan::query()
            ->with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'banAn:MaBan,TenBan,KhuVuc',
            ]);

        if (!empty($filters['trang_thai'])) {
            $query->where('TrangThai', $filters['trang_thai']);
        }

        if (!empty($filters['ngay'])) {
            $query->whereDate('ThoiGianDat', $filters['ngay']);
        }

        $query->orderBy('ThoiGianDat');

        $paginator = $query->paginate($filters['per_page'] ?? 20);

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

    public function canHoanCoc(Request $request)
    {
        $filters = $request->validate([
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $paginator = DatBan::query()
            ->with(['khachHang:MaKhachHang,HoTen,SoDienThoai'])
            ->where('TrangThaiHoanTien', 'ChoXuLy')
            ->orderBy('ThoiGianHuy')
            ->paginate($filters['per_page'] ?? 20);

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

    public function danhDauHoanTien(string $ma)
    {
        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $ma)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy lượt đặt bàn.',
                ], 404);
            }

            if ($datBan->TrangThaiHoanTien !== 'ChoXuLy') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Lượt đặt bàn này không có yêu cầu hoàn cọc đang chờ xử lý.',
                ], 422);
            }

            $nhanVien = auth('nhanvien')->user();

            $datBan->TrangThaiHoanTien = 'DaHoanTien';
            $datBan->MaNhanVienXuLyHoanTien = $nhanVien->MaNhanVien;
            $datBan->ThoiGianHoanTien = now();
            $datBan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu hoàn tiền thành công.',
                'data' => $datBan,
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể đánh dấu hoàn tiền', [
                'ma_dat_ban' => $ma,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể đánh dấu hoàn tiền lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function xacNhan(Request $request, string $ma)
    {
        $data = $request->validate([
            'MaBan' => ['required', 'string', 'max:20', 'exists:banan,MaBan'],
        ], [
            'MaBan.required' => 'Vui lòng chọn bàn để gán.',
            'MaBan.exists' => 'Bàn được chọn không tồn tại.',
        ]);

        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $ma)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy lượt đặt bàn.',
                ], 404);
            }

            if ($datBan->TrangThai !== 'ChoXacNhan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể xác nhận lượt đặt đang ở trạng thái chờ xác nhận.',
                ], 422);
            }

            $banAn = BanAn::query()
                ->where('MaBan', $data['MaBan'])
                ->lockForUpdate()
                ->first();

            if (!$banAn || $banAn->TrangThai !== 'HoatDong') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$data['MaBan']} không khả dụng.",
                ], 422);
            }

            if ((int) $banAn->SucChua < (int) $datBan->SoLuongKhach) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$banAn->TenBan} không đủ sức chứa cho {$datBan->SoLuongKhach} khách.",
                ], 422);
            }

            $trungBan = DatBan::query()
                ->where('MaBan', $data['MaBan'])
                ->whereDate('ThoiGianDat', $datBan->ThoiGianDat->toDateString())
                ->where('BuoiAn', $datBan->BuoiAn)
                ->whereIn('TrangThai', ['DaXacNhan', 'DaNhanBan'])
                ->where('MaDatBan', '!=', $ma)
                ->lockForUpdate()
                ->exists();

            if ($trungBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => "Bàn {$banAn->TenBan} đã được xếp cho một lượt đặt khác cùng buổi.",
                ], 422);
            }

            $nhanVien = auth('nhanvien')->user();

            $datBan->MaBan = $data['MaBan'];
            $datBan->MaNhanVienXuLy = $nhanVien->MaNhanVien;
            $datBan->TrangThai = 'DaXacNhan';
            $datBan->ThoiGianXacNhan = now();
            $datBan->save();

            $this->thongBao->gui(
                $datBan->MaKhachHang,
                'Đặt bàn đã được xác nhận',
                "Lượt đặt bàn {$ma} đã được xác nhận tại {$banAn->TenBan}. Hẹn gặp bạn đúng giờ!"
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã xác nhận và gán bàn.',
                'data' => $datBan,
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể xác nhận đặt bàn', [
                'ma_dat_ban' => $ma,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể xác nhận lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function tuChoi(Request $request, string $ma)
    {
        $data = $request->validate([
            'ly_do' => ['required', 'string', 'max:255'],
        ], [
            'ly_do.required' => 'Vui lòng nhập lý do từ chối.',
        ]);

        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $ma)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy lượt đặt bàn.',
                ], 404);
            }

            if ($datBan->TrangThai !== 'ChoXacNhan') {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể từ chối lượt đặt đang ở trạng thái chờ xác nhận.',
                ], 422);
            }

            $nhanVien = auth('nhanvien')->user();

            $datBan->TrangThai = 'TuChoi';

            /*
             * Từ chối là lỗi thuộc về nhà hàng (hết bàn phù hợp dù khách đã
             * cọc) — luôn hoàn 100% cọc bất kể mốc thời gian.
             */
            if ($datBan->TrangThaiCoc === 'DaThanhToan') {
                $datBan->TrangThaiCoc = 'DaHoanToanBo';
            }

            $datBan->MaNhanVienXuLy = $nhanVien->MaNhanVien;
            $datBan->LyDoTuChoiHuy = trim($data['ly_do']);
            $datBan->ThoiGianHuy = now();
            $datBan->save();

            $this->thongBao->gui(
                $datBan->MaKhachHang,
                'Không thể xác nhận đặt bàn',
                "Rất tiếc, lượt đặt bàn {$ma} không thể xác nhận: {$data['ly_do']}. Cọc đã được hoàn lại."
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã từ chối lượt đặt bàn.',
                'data' => $datBan,
            ]);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể từ chối đặt bàn', [
                'ma_dat_ban' => $ma,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể từ chối lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function checkin(Request $request, string $ma)
    {
        $data = $request->validate([
            'chi_tiet' => ['required', 'array', 'min:1', 'max:50'],
            'chi_tiet.*.MaLoaiVe' => [
                'required', 'string', 'max:20', 'distinct', 'exists:loaive,MaLoaiVe',
            ],
            'chi_tiet.*.SoLuong' => ['required', 'integer', 'min:1', 'max:100'],
        ], [
            'chi_tiet.required' => 'Vui lòng chọn ít nhất một loại vé.',
        ]);

        $nhanVien = auth('nhanvien')->user();

        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $ma)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy lượt đặt bàn.',
                ], 404);
            }

            if ($datBan->TrangThai !== 'DaXacNhan' || !$datBan->MaBan) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể check-in lượt đặt đã được xác nhận và đã gán bàn.',
                ], 422);
            }

            $ketQua = $this->moBanService->moBan(
                $datBan->MaBan,
                $data['chi_tiet'],
                $nhanVien,
                $ma,
                $datBan->MaKhachHang
            );

            $datBan->TrangThai = 'DaNhanBan';
            $datBan->ThoiGianCheckIn = now();
            $datBan->MaHoaDon = $ketQua['MaHoaDon'];
            $datBan->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đã check-in và mở hóa đơn.',
                'data' => [
                    'MaDatBan' => $ma,
                    'MaHoaDon' => $ketQua['MaHoaDon'],
                    'SoBan' => $ketQua['SoBan'],
                    'TongTien' => $ketQua['TongTien'],
                ],
            ]);
        } catch (MoBanKhongThanhCongException $exception) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->status);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Không thể check-in đặt bàn', [
                'ma_dat_ban' => $ma,
                'staff_id' => auth('nhanvien')->id(),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể check-in lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }
}

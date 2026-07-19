<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use App\Models\LichSuGiaoDichDiem;
use App\Models\UuDai;
use App\Models\VoucherKhachHang;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VoucherController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /** Voucher khách hàng đang sở hữu. */
    public function myVoucher()
    {
        $user = auth('khachhang')->user();

        return response()->json(
            VoucherKhachHang::with('uuDai')
                ->where('MaKhachHang', $user->MaKhachHang)
                ->orderByDesc('NgayCap')
                ->orderByRaw('CAST(SUBSTRING(MaVoucherKhachHang, 4) AS UNSIGNED) DESC')
                ->paginate(6)
        );
    }

    /** Kho voucher khách hàng có khả năng đổi ngay (đủ điểm, đúng hạng, còn hiệu lực). */
    public function voucherStore()
    {
        $user = auth('khachhang')->user();
        $today = now()->toDateString();

        $vouchers = UuDai::query()
            ->where('TrangThai', 'HoatDong')
            ->where('SoLuongTon', '>', 0)
            ->whereDate('NgayBatDau', '<=', $today)
            ->whereDate('NgayKetThuc', '>=', $today)
            ->where('SoDiemCanDoi', '<=', max(0, (int) $user->TongDiem))
            ->where(function ($query) use ($user) {
                $query->whereNull('MaHangThanhVien')
                    ->orWhere('MaHangThanhVien', $user->MaHangThanhVien);
            })
            ->orderBy('ThuTuApDung')
            ->orderBy('SoDiemCanDoi')
            ->orderByRaw('CAST(SUBSTRING(MaUuDai, 3) AS UNSIGNED) ASC')
            ->paginate(6);

        return response()->json($vouchers);
    }

    /** Voucher nổi bật trang chủ thành viên. */
    public function hot()
    {
        $user = auth('khachhang')->user();
        $today = now()->toDateString();

        $redemptionCounts = VoucherKhachHang::query()
            ->selectRaw('MaUuDai, COUNT(*) AS SoLuotDoi')
            ->groupBy('MaUuDai');

        $vouchers = UuDai::query()
            ->leftJoinSub($redemptionCounts, 'redemptions', 'uudai.MaUuDai', '=', 'redemptions.MaUuDai')
            ->where('uudai.TrangThai', 'HoatDong')
            ->where('uudai.SoLuongTon', '>', 0)
            ->whereDate('uudai.NgayBatDau', '<=', $today)
            ->whereDate('uudai.NgayKetThuc', '>=', $today)
            ->where(function ($query) use ($user) {
                $query->whereNull('uudai.MaHangThanhVien')
                    ->orWhere('uudai.MaHangThanhVien', $user->MaHangThanhVien);
            })
            ->orderByRaw('COALESCE(redemptions.SoLuotDoi, 0) DESC')
            ->orderBy('uudai.ThuTuApDung')
            ->orderByRaw('CAST(SUBSTRING(uudai.MaUuDai, 3) AS UNSIGNED) ASC')
            ->limit(4)
            ->get('uudai.*');

        return response()->json(['success' => true, 'data' => $vouchers]);
    }

    /**
     * Đổi voucher. Điểm, tồn kho, voucher sở hữu và lịch sử điểm được cập nhật
     * nguyên tử để không thể trừ điểm hai lần hoặc phát vượt tồn kho.
     */
    public function exchangeVoucher(Request $request)
    {
        $data = $request->validate([
            'MaUuDai' => ['required', 'string', 'exists:uudai,MaUuDai'],
        ]);
        $authenticatedUser = auth('khachhang')->user();

        try {
            $result = DB::transaction(function () use ($authenticatedUser, $data) {
                // Luôn khóa khách hàng trước rồi mới khóa ưu đãi. Thứ tự này đồng
                // nhất với luồng thanh toán để giảm nguy cơ deadlock.
                $customer = KhachHang::where('MaKhachHang', $authenticatedUser->MaKhachHang)
                    ->lockForUpdate()
                    ->first();
                $offer = UuDai::where('MaUuDai', $data['MaUuDai'])
                    ->lockForUpdate()
                    ->first();

                if (!$customer || $customer->TrangThai !== 'HoatDong') {
                    return $this->businessError('Tài khoản không còn đủ điều kiện đổi voucher.', 403);
                }
                if (!$offer) {
                    return $this->businessError('Voucher không còn tồn tại.', 404);
                }

                $today = now()->toDateString();
                $isInDateRange = !empty($offer->NgayBatDau)
                    && !empty($offer->NgayKetThuc)
                    && $offer->NgayBatDau <= $today
                    && $offer->NgayKetThuc >= $today;
                $isForRank = !$offer->MaHangThanhVien
                    || $offer->MaHangThanhVien === $customer->MaHangThanhVien;

                if ($offer->TrangThai !== 'HoatDong' || !$isInDateRange || !$isForRank) {
                    return $this->businessError('Voucher không còn đủ điều kiện để đổi.', 409);
                }
                if ((int) $offer->SoLuongTon <= 0) {
                    return $this->businessError('Voucher đã hết.', 409);
                }

                $requiredPoints = max(0, (int) $offer->SoDiemCanDoi);
                $pointsBefore = max(0, (int) $customer->TongDiem);
                if ($pointsBefore < $requiredPoints) {
                    return $this->businessError('Bạn không đủ điểm để đổi voucher.', 409);
                }

                $ownedVoucherCode = $this->codes->next(
                    'voucherkhachhang',
                    'MaVoucherKhachHang',
                    'VKH'
                );
                $pointsAfter = $pointsBefore - $requiredPoints;

                $customer->TongDiem = $pointsAfter;
                $customer->save();

                $offer->SoLuongTon = (int) $offer->SoLuongTon - 1;
                $offer->save();

                VoucherKhachHang::create([
                    'MaVoucherKhachHang' => $ownedVoucherCode,
                    'TrangThai' => 'ChuaSuDung',
                    'MaKhachHang' => $customer->MaKhachHang,
                    'MaUuDai' => $offer->MaUuDai,
                    'NgaySuDung' => null,
                    'NgayCap' => now(),
                    'NgayHetHan' => $offer->NgayKetThuc ?: now()->addDays(30)->toDateString(),
                ]);

                if ($requiredPoints > 0) {
                    LichSuGiaoDichDiem::create([
                        'MaGiaoDichDiem' => $this->codes->next(
                            'lichsugiaodichdiem',
                            'MaGiaoDichDiem',
                            'GDD'
                        ),
                        'LoaiGiaoDich' => 'DoiVoucher',
                        'SoDiem' => $requiredPoints,
                        'SoDiemTruoc' => $pointsBefore,
                        'SoDiemSau' => $pointsAfter,
                        'MaKhachHang' => $customer->MaKhachHang,
                        'MaThamChieu' => $ownedVoucherCode,
                        'ThoiGianGiaoDich' => now(),
                    ]);
                }

                return [
                    'success' => true,
                    'TongDiem' => $pointsAfter,
                    'MaVoucherKhachHang' => $ownedVoucherCode,
                ];
            });
        } catch (\Throwable $exception) {
            Log::error('Không thể đổi voucher', [
                'customer_id' => $authenticatedUser->MaKhachHang,
                'offer_id' => $data['MaUuDai'],
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể đổi voucher lúc này. Vui lòng thử lại.',
            ], 500);
        }

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], $result['status']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đổi voucher thành công.',
            'TongDiem' => $result['TongDiem'],
            'data' => [
                'MaVoucherKhachHang' => $result['MaVoucherKhachHang'],
                'TongDiem' => $result['TongDiem'],
            ],
        ]);
    }

    /** @return array{success: false, message: string, status: int} */
    private function businessError(string $message, int $status): array
    {
        return ['success' => false, 'message' => $message, 'status' => $status];
    }
}

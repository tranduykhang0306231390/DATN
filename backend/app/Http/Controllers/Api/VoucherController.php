<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use App\Models\LichSuGiaoDichDiem;
use App\Models\UuDai;
use App\Models\VoucherKhachHang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoucherController extends Controller
{
    /**
     * Voucher khách hàng đang sở hữu
     */
    public function myVoucher()
{
    $user = auth('khachhang')->user();

    $vouchers = VoucherKhachHang::with('uuDai')
        ->where('MaKhachHang', $user->MaKhachHang)
        ->orderByDesc('NgayCap')
        ->paginate(6);

    return response()->json($vouchers);
}

    /**
     * Kho voucher
     */
    public function voucherStore()
    {
        $user = auth('khachhang')->user();

        $vouchers = UuDai::where('TrangThai', 'HoatDong')
            ->where('SoLuongTon', '>', 0)
            ->whereDate('NgayBatDau', '<=', now())
            ->whereDate('NgayKetThuc', '>=', now())
            ->where(function ($q) use ($user) {

                $q->whereNull('MaHangThanhVien')
                    ->orWhere('MaHangThanhVien', $user->MaHangThanhVien);

            })
            ->orderBy('ThuTuApDung')
            ->orderBy('SoDiemCanDoi')
            ->paginate(6);

        return response()->json($vouchers);
    }

    /**
     * Voucher nổi bật trang Home
     */
    public function hot()
    {
        $user = auth('khachhang')->user();

        $vouchers = UuDai::where('TrangThai', 'HoatDong')
            ->where('SoLuongTon', '>', 0)
            ->whereDate('NgayBatDau', '<=', now())
            ->whereDate('NgayKetThuc', '>=', now())
            ->where(function ($q) use ($user) {

                $q->whereNull('MaHangThanhVien')
                    ->orWhere('MaHangThanhVien', $user->MaHangThanhVien);

            })
            ->orderByDesc('GiaTriGiam')
            ->take(4)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vouchers
        ]);
    }

    /**
     * Đổi voucher
     */
    public function exchangeVoucher(Request $request)
    {
        $request->validate([
            'MaUuDai' => 'required'
        ]);

        $user = auth('khachhang')->user();

        $voucher = UuDai::where('MaUuDai', $request->MaUuDai)
            ->where('TrangThai', 'HoatDong')
            ->first();

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher không tồn tại.'
            ], 404);
        }

        if ($voucher->SoLuongTon <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher đã hết.'
            ], 400);
        }

        if ($user->TongDiem < $voucher->SoDiemCanDoi) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không đủ điểm để đổi voucher.'
            ], 400);
        }

        DB::beginTransaction();

        try {

            $voucher = UuDai::where('MaUuDai', $request->MaUuDai)
                ->where('TrangThai', 'HoatDong')
                ->lockForUpdate()
                ->first();

            $khachHang = KhachHang::where(
                'MaKhachHang',
                $user->MaKhachHang
            )->lockForUpdate()->first();

            if (!$voucher || $voucher->SoLuongTon <= 0) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Voucher đã hết hoặc không còn hoạt động.'
                ], 400);
            }

            if ($khachHang->TongDiem < $voucher->SoDiemCanDoi) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không đủ điểm để đổi voucher.'
                ], 400);
            }

            $diemTruoc = $khachHang->TongDiem;

            $diemSau = $diemTruoc - $voucher->SoDiemCanDoi;

            $khachHang->TongDiem = $diemSau;

            $khachHang->save();

            $voucher->SoLuongTon--;

            $voucher->save();
                        // ===== Sinh mã VoucherKhachHang =====

            $lastVoucher = VoucherKhachHang::orderByDesc('MaVoucherKhachHang')
                ->lockForUpdate()
                ->first();

            if ($lastVoucher) {

                $stt = intval(substr($lastVoucher->MaVoucherKhachHang, 3)) + 1;

            } else {

                $stt = 1;

            }

            $maVoucherKH = 'VKH' . str_pad($stt, 3, '0', STR_PAD_LEFT);

            // ===== Ngày cấp và ngày hết hạn =====

            $ngayCap = now();

            if ($voucher->NgayKetThuc) {

                $ngayHetHan = $voucher->NgayKetThuc;

            } else {

                $ngayHetHan = now()->addDays(30);

            }

            VoucherKhachHang::create([

                'MaVoucherKhachHang' => $maVoucherKH,
                'TrangThai' => 'ChuaSuDung',
                'MaKhachHang' => $khachHang->MaKhachHang,
                'MaUuDai' => $voucher->MaUuDai,
                'NgaySuDung' => null,
                'NgayCap' => $ngayCap,
                'NgayHetHan' => $ngayHetHan,

            ]);

            // ===== Sinh mã giao dịch điểm =====

            $lastGD = LichSuGiaoDichDiem::orderByDesc('MaGiaoDichDiem')
                ->lockForUpdate()
                ->first();

            if ($lastGD) {

                $sttGD = intval(substr($lastGD->MaGiaoDichDiem, 3)) + 1;

            } else {

                $sttGD = 1;

            }

            $maGD = 'GDD' . str_pad($sttGD, 3, '0', STR_PAD_LEFT);

            // ===== Lưu lịch sử giao dịch điểm =====

            LichSuGiaoDichDiem::create([

                'MaGiaoDichDiem' => $maGD,
                'LoaiGiaoDich' => 'DoiVoucher',
                'SoDiem' => $voucher->SoDiemCanDoi,
                'SoDiemTruoc' => $diemTruoc,
                'SoDiemSau' => $diemSau,
                'MaKhachHang' => $khachHang->MaKhachHang,
                'MaThamChieu' => $maVoucherKH,
                'ThoiGianGiaoDich' => now(),

            ]);

            DB::commit();

            return response()->json([

                'success' => true,
                'message' => 'Đổi voucher thành công.'

            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([

                'success' => false,
                'message' => $e->getMessage()

            ], 500);

        }

    }

}

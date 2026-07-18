<?php
// app/Http/Controllers/Api/TraCuuKhachHangController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use App\Models\VoucherKhachHang;
use Illuminate\Http\Request;

class TraCuuKhachHangController extends Controller
{
    /**
     * Tra cứu khách hàng theo SĐT
     * Trả về thông tin KH + danh sách voucher còn hiệu lực
     */
    public function lookup(Request $request)
    {
        $data = $request->validate([
            'so_dien_thoai' => ['required', 'string', 'regex:/^0[0-9]{9}$/'],
        ]);

        $khachHang = KhachHang::with('hangThanhVien')
            ->where('SoDienThoai', trim($data['so_dien_thoai']))
            ->where('TrangThai', 'HoatDong')
            ->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng hoặc tài khoản đã bị khóa'
            ], 404);
        }

        $today = now()->toDateString();
        $vouchers = VoucherKhachHang::with('uuDai')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChuaSuDung')
            ->where('NgayHetHan', '>=', $today)
            ->whereHas('uuDai', function ($query) use ($today) {
                $query->where('TrangThai', 'HoatDong')
                    ->whereDate('NgayBatDau', '<=', $today)
                    ->whereDate('NgayKetThuc', '>=', $today);
            })
            ->get()
            ->filter(fn ($voucher) => $voucher->uuDai !== null)
            ->map(fn($v) => [
                'MaVoucherKhachHang' => $v->MaVoucherKhachHang,
                'TenUuDai'           => $v->uuDai->TenUuDai,
                'GiaTriGiam'         => $v->uuDai->GiaTriGiam,
                'NhomUuDai'          => $v->uuDai->NhomUuDai,
                'CoTheDungChung'     => $v->uuDai->CoTheDungChung,
                'ThuTuApDung'        => $v->uuDai->ThuTuApDung,
                'NgayHetHan'         => $v->NgayHetHan,
                'MoTa'               => $v->uuDai->MoTa,
            ]);

        return response()->json([
            'success'   => true,
            'khachHang' => [
                'MaKhachHang'     => $khachHang->MaKhachHang,
                'HoTen'           => $khachHang->HoTen,
                'SoDienThoai'     => $khachHang->SoDienThoai,
                'TongDiem'        => $khachHang->TongDiem,
                'TenHang'         => $khachHang->hangThanhVien->TenHang ?? '',
                'MaHangThanhVien' => $khachHang->MaHangThanhVien,
            ],
            'vouchers' => $vouchers
        ]);
    }
}

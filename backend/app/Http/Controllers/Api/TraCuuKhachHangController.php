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
        $request->validate([
            'so_dien_thoai' => 'required|string'
        ]);

        $khachHang = KhachHang::with('hangThanhVien')
            ->where('SoDienThoai', $request->so_dien_thoai)
            ->where('TrangThai', 'HoatDong')
            ->first();

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng hoặc tài khoản đã bị khóa'
            ], 404);
        }

        $vouchers = VoucherKhachHang::with('uuDai')
            ->where('MaKhachHang', $khachHang->MaKhachHang)
            ->where('TrangThai', 'ChuaSuDung')
            ->where('NgayHetHan', '>=', now()->format('Y-m-d'))
            ->get()
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
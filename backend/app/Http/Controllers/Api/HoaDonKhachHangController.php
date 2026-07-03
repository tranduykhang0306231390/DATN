<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;

class HoaDonKhachHangController extends Controller
{
    /**
     * Danh sách hóa đơn của khách hàng
     */
    public function index()
    {
        $user = auth('khachhang')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $hoaDons = HoaDon::where('MaKhachHang', $user->MaKhachHang)
            ->orderByDesc('NgayLap')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $hoaDons
        ]);
    }

    /**
     * Chi tiết hóa đơn
     */
    public function show($id)
    {
        $user = auth('khachhang')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $hoaDon = HoaDon::with([
            'chiTietHoaDon.loaiVe',
            'voucherKhachHang.uuDai',
            'nhanVien'
        ])
            ->where('MaHoaDon', $id)
            ->where('MaKhachHang', $user->MaKhachHang)
            ->first();

        if (!$hoaDon) {
            return response()->json([
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $hoaDon
        ]);
    }
}
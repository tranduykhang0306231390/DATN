<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use Illuminate\Http\Request;

class HoaDonKhachHangController extends Controller
{
    /**
     * Danh sách hóa đơn của khách hàng (có phân trang)
     */
    public function index(Request $request)
    {
        $user = auth('khachhang')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Số hóa đơn mỗi trang, cho phép frontend truyền ?per_page=
        // nhưng luôn giới hạn tối đa 50 để tránh lạm dụng
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 50 ? $perPage : 10;

        $hoaDons = HoaDon::where('MaKhachHang', $user->MaKhachHang)
            ->orderByDesc('NgayLap')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $hoaDons->items(),
            'meta' => [
                'current_page' => $hoaDons->currentPage(),
                'last_page' => $hoaDons->lastPage(),
                'per_page' => $hoaDons->perPage(),
                'total' => $hoaDons->total(),
            ]
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
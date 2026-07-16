<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use Illuminate\Http\Request;

class HoaDonKhachHangController extends Controller
{
    /**
     * Danh sách hóa đơn của khách hàng (có phân trang, tìm kiếm & lọc)
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

        $query = HoaDon::where('MaKhachHang', $user->MaKhachHang);

        // Tìm kiếm theo mã hóa đơn (search bar)
        if ($request->filled('keyword')) {
            $keyword = trim($request->query('keyword'));
            $query->where('MaHoaDon', 'like', '%' . $keyword . '%');
        }

        // Lọc theo khoảng ngày lập (tu_ngay -> den_ngay)
        if ($request->filled('tu_ngay')) {
            $query->whereDate('NgayLap', '>=', $request->query('tu_ngay'));
        }
        if ($request->filled('den_ngay')) {
            $query->whereDate('NgayLap', '<=', $request->query('den_ngay'));
        }

        // Sắp xếp theo ngày lập: newest (mặc định) hoặc oldest
        $sortOrder = $request->query('sort_order', 'newest');
        $sortOrder = $sortOrder === 'oldest' ? 'oldest' : 'newest';

        if ($sortOrder === 'oldest') {
            $query->orderBy('NgayLap', 'asc');
        } else {
            $query->orderByDesc('NgayLap');
        }

        $hoaDons = $query->paginate($perPage);

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
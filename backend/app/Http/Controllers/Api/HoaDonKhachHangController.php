<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\VoucherKhachHang;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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

        $filters = $request->validate([
            'keyword' => ['nullable', 'string', 'max:100'],
            'tu_ngay' => ['nullable', 'date'],
            'den_ngay' => ['nullable', 'date'],
            'sort_order' => ['nullable', Rule::in(['newest', 'oldest'])],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if (
            !empty($filters['tu_ngay'])
            && !empty($filters['den_ngay'])
            && $filters['den_ngay'] < $filters['tu_ngay']
        ) {
            throw ValidationException::withMessages([
                'den_ngay' => ['Ngày kết thúc phải từ ngày bắt đầu trở đi.'],
            ]);
        }

        $query = HoaDon::where('MaKhachHang', $user->MaKhachHang);

        // Tìm kiếm theo mã hóa đơn (search bar)
        if ($keyword = trim((string) ($filters['keyword'] ?? ''))) {
            $query->where('MaHoaDon', 'like', '%' . $keyword . '%');
        }

        // Lọc theo khoảng ngày lập (tu_ngay -> den_ngay)
        if (!empty($filters['tu_ngay'])) {
            $query->whereDate('NgayLap', '>=', $filters['tu_ngay']);
        }
        if (!empty($filters['den_ngay'])) {
            $query->whereDate('NgayLap', '<=', $filters['den_ngay']);
        }

        // Sắp xếp theo ngày lập: newest (mặc định) hoặc oldest
        $sortOrder = $filters['sort_order'] ?? 'newest';

        if ($sortOrder === 'oldest') {
            $query->orderBy('NgayLap', 'asc')
                ->orderByRaw('CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED) ASC');
        } else {
            $query->orderByDesc('NgayLap')
                ->orderByRaw('CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED) DESC');
        }

        $hoaDons = $query->paginate($filters['per_page'] ?? 10);

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

        $voucherIds = collect(explode(',', (string) $hoaDon->MaVoucher))
            ->map(fn ($voucherId) => trim($voucherId))
            ->filter()
            ->unique()
            ->values();

        $vouchers = $voucherIds->isEmpty()
            ? collect()
            : VoucherKhachHang::with('uuDai')
                ->where('MaKhachHang', $user->MaKhachHang)
                ->whereIn('MaVoucherKhachHang', $voucherIds)
                ->get()
                ->sortBy(fn ($voucher) => $voucherIds->search($voucher->MaVoucherKhachHang))
                ->values();

        // Thuộc tính cộng thêm, không loại bỏ field cũ trong response.
        $hoaDon->setAttribute('vouchers_ap_dung', $vouchers);

        return response()->json([
            'success' => true,
            'data' => $hoaDon
        ]);
    }
}

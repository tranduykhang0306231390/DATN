<?php
// app/Http/Controllers/Api/QuanLyHoaDonController.php
// Xử lý: danh sách + lọc + hủy hóa đơn

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HoaDon;
use App\Models\KhachHang;
use App\Models\VoucherKhachHang;
use App\Services\DiemTichLuyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuanLyHoaDonController extends Controller
{
    public function __construct(
        private DiemTichLuyService $diemService
    ) {}

    /**
     * Danh sách hóa đơn — lọc + phân trang
     */
    public function index(Request $request)
    {
        $query = HoaDon::with([
                'khachHang:MaKhachHang,HoTen,SoDienThoai',
                'nhanVien:MaNhanVien,HoTen',
                'chiTietHoaDon.loaiVe:MaLoaiVe,TenLoaiVe',
            ])
            ->orderBy('NgayLap', 'desc');

        if ($request->filled('tu_ngay')) {
            $query->whereDate('NgayLap', '>=', $request->tu_ngay);
        }
        if ($request->filled('den_ngay')) {
            $query->whereDate('NgayLap', '<=', $request->den_ngay);
        }
        if ($request->filled('trang_thai')) {
            $query->where('TrangThai', $request->trang_thai);
        }
        if ($request->filled('keyword')) {
            $kw = $request->keyword;
            $query->whereHas('khachHang', fn($q) =>
                $q->where('HoTen', 'like', "%{$kw}%")
                  ->orWhere('SoDienThoai', 'like', "%{$kw}%")
            );
        }

        $hoaDons = $query->paginate($request->get('per_page', 10));

        $tongDoanhThu = HoaDon::where('TrangThai', 'DaThanhToan')
            ->when($request->filled('tu_ngay'),  fn($q) => $q->whereDate('NgayLap', '>=', $request->tu_ngay))
            ->when($request->filled('den_ngay'), fn($q) => $q->whereDate('NgayLap', '<=', $request->den_ngay))
            ->sum('TongTien');

        return response()->json([
            'success'    => true,
            'data'       => $hoaDons->items(),
            'pagination' => [
                'current_page' => $hoaDons->currentPage(),
                'last_page'    => $hoaDons->lastPage(),
                'per_page'     => $hoaDons->perPage(),
                'total'        => $hoaDons->total(),
            ],
            'thong_ke'   => [
                'tong_hoa_don'   => $hoaDons->total(),
                'tong_doanh_thu' => $tongDoanhThu,
            ],
        ]);
    }

    /**
     * Chi tiết hóa đơn
     */
    public function show(string $maHD)
    {
        $hoaDon = HoaDon::with([
            'chiTietHoaDon.loaiVe',
            'khachHang.hangThanhVien',
            'nhanVien:MaNhanVien,HoTen',
            'hangThanhVien:MaHangThanhVien,TenHang',
        ])->find($maHD);

        if (!$hoaDon) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $hoaDon]);
    }

    /**
     * Hủy hóa đơn
     * Tự động hoàn điểm + khôi phục voucher qua DiemTichLuyService
     */
    public function huy(string $maHD)
    {
        $hoaDon = HoaDon::find($maHD);

        if (!$hoaDon) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        if ($hoaDon->TrangThai !== 'DaThanhToan') {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể hủy hóa đơn ở trạng thái Đã thanh toán'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $hoaDon->update(['TrangThai' => 'DaHuy']);

            // Hoàn điểm nếu có
            if ($hoaDon->MaKhachHang && $hoaDon->DiemTichLuy > 0) {
                $khachHang = KhachHang::find($hoaDon->MaKhachHang);
                if ($khachHang) {
                    $this->diemService->hoanDiem($khachHang, $hoaDon->DiemTichLuy, $maHD);
                }
            }

            // Khôi phục voucher
            if ($hoaDon->MaVoucher) {
                VoucherKhachHang::whereIn('MaVoucherKhachHang', explode(',', $hoaDon->MaVoucher))
                    ->update(['TrangThai' => 'ChuaSuDung', 'NgaySuDung' => null]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Hủy hóa đơn thành công',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}
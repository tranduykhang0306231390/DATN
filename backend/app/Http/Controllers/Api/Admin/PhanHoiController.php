<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PhanHoiController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * Danh sách phản hồi, kèm bộ lọc và phân trang.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'trang_thai' => ['nullable', Rule::in(['ChuaXuLy', 'DaXuLy'])],
            'diem' => ['nullable', 'integer', 'between:1,5'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('phanhoikhachhang as ph')
            ->leftJoin('khachhang as kh', 'ph.MaKhachHang', '=', 'kh.MaKhachHang')
            ->leftJoin('nhanvien as nv', 'ph.MaNhanVien', '=', 'nv.MaNhanVien')
            ->select('ph.*', 'kh.HoTen as TenKhachHang', 'nv.HoTen as TenNhanVien');

        if ($keyword = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function ($sub) use ($keyword) {
                $sub->where('ph.NoiDungCuaKhachHang', 'like', "%{$keyword}%")
                    ->orWhere('ph.MaPhanHoi', 'like', "%{$keyword}%")
                    ->orWhere('ph.MaHoaDon', 'like', "%{$keyword}%")
                    ->orWhere('kh.HoTen', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['trang_thai'])) {
            $query->where('ph.TrangThaiXuLy', $filters['trang_thai']);
        }
        if (isset($filters['diem'])) {
            $query->where('ph.DiemDanhGia', $filters['diem']);
        }

        $paginator = $query
            ->orderBy('ph.TrangThaiXuLy')
            ->orderByDesc('ph.ThoiGian')
            ->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'thong_ke' => $this->thongKe(),
        ]);
    }

    public function show(string $ma)
    {
        $phanHoi = DB::table('phanhoikhachhang as ph')
            ->leftJoin('khachhang as kh', 'ph.MaKhachHang', '=', 'kh.MaKhachHang')
            ->leftJoin('nhanvien as nv', 'ph.MaNhanVien', '=', 'nv.MaNhanVien')
            ->select('ph.*', 'kh.HoTen as TenKhachHang', 'kh.SoDienThoai', 'nv.HoTen as TenNhanVien')
            ->where('ph.MaPhanHoi', $ma)
            ->first();

        if (!$phanHoi) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phản hồi',
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $phanHoi]);
    }

    /**
     * Lưu câu trả lời và tạo thông báo trong cùng một transaction.
     */
    public function traLoi(Request $request, string $ma)
    {
        $data = $request->validate([
            'NoiDungPhanHoiCuaHang' => ['required', 'string', 'max:500'],
        ]);

        $updated = DB::transaction(function () use ($data, $ma) {
            $phanHoi = DB::table('phanhoikhachhang')
                ->where('MaPhanHoi', $ma)
                ->lockForUpdate()
                ->first();

            if (!$phanHoi) return false;

            if ($phanHoi->TrangThaiXuLy === 'DaXuLy') {
                throw ValidationException::withMessages([
                    'NoiDungPhanHoiCuaHang' => ['Phản hồi này đã được xử lý trước đó.'],
                ]);
            }

            DB::table('phanhoikhachhang')
                ->where('MaPhanHoi', $ma)
                ->update([
                    'NoiDungPhanHoiCuaHang' => $data['NoiDungPhanHoiCuaHang'],
                    'TrangThaiXuLy' => 'DaXuLy',
                    'ThoiGianPhanHoi' => now(),
                    'MaNhanVien' => auth('nhanvien')->user()->MaNhanVien,
                ]);

            DB::table('thongbao')->insert([
                'MaThongBao' => $this->codes->next('thongbao', 'MaThongBao', 'TB'),
                'TieuDe' => 'Phản hồi của bạn đã được hồi đáp',
                'NoiDung' => 'Nhà hàng đã phản hồi đánh giá của bạn cho hóa đơn '
                    . $phanHoi->MaHoaDon . '. Bạn có thể xem lại trong lịch sử hóa đơn.',
                'ThoiGian' => now(),
                'TrangThai' => 'ChuaDoc',
                'MaKhachHang' => $phanHoi->MaKhachHang,
            ]);

            return true;
        });

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phản hồi',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi phản hồi tới khách hàng',
        ]);
    }

    private function thongKe(): array
    {
        $tong = (int) DB::table('phanhoikhachhang')->count();
        $chuaXuLy = (int) DB::table('phanhoikhachhang')
            ->where('TrangThaiXuLy', 'ChuaXuLy')
            ->count();
        $diemTrungBinh = (float) (DB::table('phanhoikhachhang')->avg('DiemDanhGia') ?? 0);

        return [
            'tong' => $tong,
            'chua_xu_ly' => $chuaXuLy,
            'diem_trung_binh' => round($diemTrungBinh, 1),
        ];
    }
}

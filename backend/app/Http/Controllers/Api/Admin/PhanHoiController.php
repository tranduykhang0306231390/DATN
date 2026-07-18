<?php
// app/Http/Controllers/Api/Admin/PhanHoiController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ThongBao;
class PhanHoiController extends Controller
{
    /**
     * Danh sách phản hồi (tìm + lọc trạng thái/số sao + phân trang).
     * params: search, trang_thai, diem, per_page, page
     */
    public function index(Request $request)
    {
        $query = DB::table('phanhoikhachhang as ph')
            ->leftJoin('khachhang as kh', 'ph.MaKhachHang', '=', 'kh.MaKhachHang')
            ->leftJoin('nhanvien as nv', 'ph.MaNhanVien', '=', 'nv.MaNhanVien')
            ->select('ph.*', 'kh.HoTen as TenKhachHang', 'kh.SoDienThoai', 'nv.HoTen as TenNhanVien');

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('ph.NoiDungCuaKhachHang', 'like', "%{$kw}%")
                    ->orWhere('ph.MaPhanHoi', 'like', "%{$kw}%")
                    ->orWhere('ph.MaHoaDon', 'like', "%{$kw}%")
                    ->orWhere('kh.HoTen', 'like', "%{$kw}%")
                    ->orWhere('kh.SoDienThoai', 'like', "%{$kw}%");
            });
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('ph.TrangThaiXuLy', $tt);
        }
        if ($diem = $request->query('diem')) {
            $query->where('ph.DiemDanhGia', (int) $diem);
        }

        // Chưa xử lý lên đầu, rồi tới mới nhất
        $query->orderBy('ph.TrangThaiXuLy', 'asc')
              ->orderBy('ph.ThoiGian', 'desc');

        $perPage   = max(1, min(100, (int) $request->query('per_page', 10)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success'    => true,
            'data'       => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
            'thong_ke'   => $this->thongKe(),
        ]);
    }

    public function show(string $ma)
    {
        $ph = DB::table('phanhoikhachhang as ph')
            ->leftJoin('khachhang as kh', 'ph.MaKhachHang', '=', 'kh.MaKhachHang')
            ->leftJoin('nhanvien as nv', 'ph.MaNhanVien', '=', 'nv.MaNhanVien')
            ->select('ph.*', 'kh.HoTen as TenKhachHang', 'kh.SoDienThoai', 'nv.HoTen as TenNhanVien')
            ->where('ph.MaPhanHoi', $ma)
            ->first();

        if (!$ph) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phản hồi'], 404);
        }

        return response()->json(['success' => true, 'data' => $ph]);
    }

    /**
     * Trả lời phản hồi -> tự đánh dấu đã xử lý, lưu người trả lời & thời gian.
     */
    public function traLoi(Request $request, string $ma)
{
    $data = $request->validate([
        'NoiDungPhanHoiCuaHang' => ['required', 'string', 'max:500'],
    ]);

    $ph = DB::table('phanhoikhachhang')
        ->where('MaPhanHoi', $ma)
        ->first();

    if (!$ph) {
        return response()->json([
            'success' => false,
            'message' => 'Không tìm thấy phản hồi'
        ], 404);
    }

    // Cập nhật phản hồi
    DB::table('phanhoikhachhang')
        ->where('MaPhanHoi', $ma)
        ->update([
            'NoiDungPhanHoiCuaHang' => $data['NoiDungPhanHoiCuaHang'],
            'TrangThaiXuLy'         => 'DaXuLy',
            'ThoiGianPhanHoi'       => now(),
            'MaNhanVien'            => auth('nhanvien')->user()->MaNhanVien,
        ]);

    /*
    |--------------------------------------------------------------------------
    | TẠO THÔNG BÁO CHO KHÁCH
    |--------------------------------------------------------------------------
    */

    $last = ThongBao::orderByDesc('MaThongBao')->lockForUpdate()->first();

    if ($last) {
        $number = intval(substr($last->MaThongBao, 2)) + 1;
    } else {
        $number = 1;
    }

    $maThongBao = 'TB' . str_pad($number, 3, '0', STR_PAD_LEFT);

    ThongBao::create([
        'MaThongBao'  => $maThongBao,
        'TieuDe'      => 'Phản hồi của bạn đã được hồi đáp',
        'NoiDung'     => 'Nhà hàng đã phản hồi đánh giá của bạn cho hóa đơn ' . $ph->MaHoaDon . '. Nhấn để xem chi tiết.',
        'ThoiGian'    => now(),
        'TrangThai'   => 'ChuaDoc',
        'MaKhachHang' => $ph->MaKhachHang,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Đã gửi phản hồi tới khách hàng',
    ]);
}

    /**
     * Số liệu nhanh: tổng, chưa xử lý, điểm trung bình.
     */
    private function thongKe(): array
    {
        $tong      = (int) DB::table('phanhoikhachhang')->count();
        $chuaXuLy  = (int) DB::table('phanhoikhachhang')->where('TrangThaiXuLy', 'ChuaXuLy')->count();
        $diemTB    = (float) DB::table('phanhoikhachhang')->avg('DiemDanhGia');

        return [
            'tong'         => $tong,
            'chua_xu_ly'   => $chuaXuLy,
            'diem_trung_binh' => round($diemTB, 1),
        ];
    }
}
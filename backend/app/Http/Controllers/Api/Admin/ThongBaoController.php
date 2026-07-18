<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ThongBaoController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * Dữ liệu phụ cho form gửi: danh sách hạng thành viên.
     */
    public function tuyChon()
    {
        $hang = DB::table('hangthanhvien')
            ->select('MaHangThanhVien', 'TenHang')
            ->orderBy('ThuTuHang')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ['hangThanhVien' => $hang],
        ]);
    }

    /**
     * Danh sách thông báo đã gửi.
     * params: search, trang_thai, per_page, page
     */
    public function index(Request $request)
    {
        $query = DB::table('thongbao as tb')
            ->leftJoin('khachhang as kh', 'tb.MaKhachHang', '=', 'kh.MaKhachHang')
            ->select('tb.*', 'kh.HoTen as TenKhachHang');

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('tb.TieuDe', 'like', "%{$kw}%")
                    ->orWhere('tb.NoiDung', 'like', "%{$kw}%")
                    ->orWhere('tb.MaThongBao', 'like', "%{$kw}%");
            });
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('tb.TrangThai', $tt);
        }

        $query->orderBy('tb.ThoiGian', 'desc');

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
        ]);
    }

    /**
     * Gửi thông báo.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'TieuDe'    => ['required', 'string', 'max:255'],
            'NoiDung'   => ['required', 'string', 'max:500'],
            'doi_tuong' => ['required', Rule::in(['TheoHang', 'TatCa'])],
            'ma_hang'   => ['required_if:doi_tuong,TheoHang', 'nullable', 'exists:hangthanhvien,MaHangThanhVien'],
        ]);

        // Xác định danh sách người nhận
        $nguoiNhan = DB::table('khachhang')->where('TrangThai', 'HoatDong');

        if ($data['doi_tuong'] === 'TheoHang') {
            $nguoiNhan->where('MaHangThanhVien', $data['ma_hang']);
        }

        $danhSach = $nguoiNhan->pluck('MaKhachHang');

        if ($danhSach->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Không có khách hàng nào phù hợp để gửi.',
            ], 422);
        }

        // Sinh mã tiếp theo
        try {
            $soLuong = DB::transaction(function () use ($danhSach, $data) {
                $codes = $this->codes->nextBatch(
                    'thongbao',
                    'MaThongBao',
                    'TB',
                    $danhSach->count()
                );
                $rows = [];
                $now = now();

                foreach ($danhSach->values() as $index => $maKH) {
                    $rows[] = [
                        'MaThongBao'  => $codes[$index],
                        'TieuDe'      => $data['TieuDe'],
                        'NoiDung'     => $data['NoiDung'],
                        'ThoiGian'    => $now,
                        'TrangThai'   => 'ChuaDoc',
                        'MaKhachHang' => $maKH,
                    ];
                }

            // Chèn theo lô để nhanh khi gửi hàng loạt
            foreach (array_chunk($rows, 200) as $chunk) {
                DB::table('thongbao')->insert($chunk);
            }

                return count($rows);
            });
        } catch (\Throwable $e) {
            Log::error('Không thể gửi thông báo hàng loạt', [
                'staff_id' => auth('nhanvien')->id(),
                'recipient_count' => $danhSach->count(),
                'exception' => $e,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi thông báo lúc này. Vui lòng thử lại.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi thông báo tới ' . $soLuong . ' khách hàng',
            'data'    => ['so_luong' => $soLuong],
        ], 201);
    }
}

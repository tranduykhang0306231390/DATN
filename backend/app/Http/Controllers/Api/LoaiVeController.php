<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LoaiVeController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}
   
    public function index(Request $request)
    {
        $query = \App\Models\LoaiVe::where('TrangThai', 'HoatDong');
 
        // Mặc định lọc theo thời điểm hiện tại; ?tat_ca=1 để xem hết
        if (!$request->boolean('tat_ca')) {
            $now = now();
 
            // Cuối tuần = thứ 7 hoặc chủ nhật
            $laCuoiTuan = in_array($now->dayOfWeek, [0, 6], true);
            $loaiNgay   = $laCuoiTuan ? 'CuoiTuan' : 'NgayThuong';
 
            // Trước 16h là buổi Trưa, từ 16h là buổi Tối
            $buoi = $now->hour < 16 ? 'Trua' : 'Toi';
 
            $query->where('LoaiNgay', $loaiNgay)
                  ->where('BuoiAn', $buoi);
        }
 
        $data = $query->orderBy('MaLoaiVe')->get();
 
        return response()->json(['success' => true, 'data' => $data]);
    }

   
    public function adminIndex(Request $request)
    {
        $query = LoaiVe::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('TenLoaiVe', 'like', "%{$kw}%")
                    ->orWhere('MaLoaiVe', 'like', "%{$kw}%");
            });
        }
        if ($ba = $request->query('buoi_an')) {
            $query->where('BuoiAn', $ba);
        }
        if ($ln = $request->query('loai_ngay')) {
            $query->where('LoaiNgay', $ln);
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaLoaiVe', 'desc');

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

    
    public function store(Request $request)
    {
        $data = $request->validate([
            'TenLoaiVe' => ['required', 'string', 'max:100'],
            'BuoiAn'    => ['required', Rule::in(['Trua', 'Toi'])],
            'LoaiNgay'  => ['required', Rule::in(['NgayThuong', 'CuoiTuan'])],
            'GiaVe'     => ['required', 'numeric', 'min:0'],
            'TrangThai' => ['nullable', Rule::in(['HoatDong', 'TamNgung'])],
        ]);

        $lv = DB::transaction(function () use ($data) {
            $lv = new LoaiVe();
            $lv->MaLoaiVe  = $this->codes->next('loaive', 'MaLoaiVe', 'LV');
            $lv->TenLoaiVe = $data['TenLoaiVe'];
            $lv->BuoiAn    = $data['BuoiAn'];
            $lv->LoaiNgay  = $data['LoaiNgay'];
            $lv->GiaVe     = $data['GiaVe'];
            $lv->TrangThai = $data['TrangThai'] ?? 'HoatDong';
            $lv->save();

            return $lv;
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm loại vé thành công',
            'data'    => $lv,
        ], 201);
    }

    
    public function update(Request $request, string $ma)
    {
        $lv = LoaiVe::find($ma);

        if (!$lv) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy loại vé',
            ], 404);
        }

        $data = $request->validate([
            'TenLoaiVe' => ['required', 'string', 'max:100'],
            'BuoiAn'    => ['required', Rule::in(['Trua', 'Toi'])],
            'LoaiNgay'  => ['required', Rule::in(['NgayThuong', 'CuoiTuan'])],
            'GiaVe'     => ['required', 'numeric', 'min:0'],
            'TrangThai' => ['required', Rule::in(['HoatDong', 'TamNgung'])],
        ]);

        $lv->TenLoaiVe = $data['TenLoaiVe'];
        $lv->BuoiAn    = $data['BuoiAn'];
        $lv->LoaiNgay  = $data['LoaiNgay'];
        $lv->GiaVe     = $data['GiaVe'];
        $lv->TrangThai = $data['TrangThai'];
        $lv->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật loại vé thành công',
            'data'    => $lv,
        ]);
    }

    // ================================================================
    // MỚI: đảo trạng thái (ngừng / mở bán). Không xóa cứng vì vé còn
    // được tham chiếu trong chi tiết hóa đơn (FK RESTRICT).
    // ================================================================
    public function toggleTrangThai(string $ma)
    {
        $lv = LoaiVe::find($ma);

        if (!$lv) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy loại vé',
            ], 404);
        }

        $lv->TrangThai = $lv->TrangThai === 'HoatDong' ? 'TamNgung' : 'HoatDong';
        $lv->save();

        return response()->json([
            'success' => true,
            'message' => $lv->TrangThai === 'HoatDong'
                ? 'Đã mở bán loại vé'
                : 'Đã ngừng bán loại vé',
            'data'    => $lv,
        ]);
    }
}

<?php
// app/Http/Controllers/Api/LoaiVeController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoaiVe;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LoaiVeController extends Controller
{
    // ================================================================
    // GIỮ NGUYÊN: dùng cho màn tạo hóa đơn (chỉ vé đang hoạt động).
    // Nếu index hiện tại của bạn đã khác, hãy giữ bản của bạn và chỉ
    // copy các method quản trị bên dưới.
    // ================================================================
    public function index()
    {
        $data = LoaiVe::where('TrangThai', 'HoatDong')
            ->orderBy('MaLoaiVe')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ================================================================
    // MỚI: danh sách cho trang quản trị (mọi trạng thái + tìm/lọc).
    // ================================================================
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

    // ================================================================
    // MỚI: thêm loại vé.
    // ================================================================
    public function store(Request $request)
    {
        $data = $request->validate([
            'TenLoaiVe' => ['required', 'string', 'max:100'],
            'BuoiAn'    => ['required', Rule::in(['Trua', 'Toi'])],
            'LoaiNgay'  => ['required', Rule::in(['NgayThuong', 'CuoiTuan'])],
            'GiaVe'     => ['required', 'numeric', 'min:0'],
            'TrangThai' => ['nullable', Rule::in(['HoatDong', 'TamNgung'])],
        ]);

        $last = LoaiVe::orderBy('MaLoaiVe', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaLoaiVe, 2)) + 1 : 1;
        $maLV = 'LV' . str_pad($so, 3, '0', STR_PAD_LEFT);

        $lv = new LoaiVe();
        $lv->MaLoaiVe  = $maLV;
        $lv->TenLoaiVe = $data['TenLoaiVe'];
        $lv->BuoiAn    = $data['BuoiAn'];
        $lv->LoaiNgay  = $data['LoaiNgay'];
        $lv->GiaVe     = $data['GiaVe'];
        $lv->TrangThai = $data['TrangThai'] ?? 'HoatDong';
        $lv->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm loại vé thành công',
            'data'    => $lv,
        ], 201);
    }

    // ================================================================
    // MỚI: cập nhật loại vé.
    // ================================================================
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
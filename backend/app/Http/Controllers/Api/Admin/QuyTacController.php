<?php
// app/Http/Controllers/Api/Admin/QuyTacController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuyTacTichDiem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuyTacController extends Controller
{
    /**
     * Danh sách quy tắc (tìm theo mã + lọc trạng thái + phân trang).
     * params: search, trang_thai, per_page, page
     */
    public function index(Request $request)
    {
        $query = QuyTacTichDiem::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where('MaQuyTac', 'like', "%{$kw}%");
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaQuyTac', 'desc');

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

    public function show(string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        return response()->json(['success' => true, 'data' => $qt]);
    }

    /**
     * Thêm quy tắc mới.
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $last = QuyTacTichDiem::orderBy('MaQuyTac', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaQuyTac, 2)) + 1 : 1;
        $maQT = 'QT' . str_pad($so, 3, '0', STR_PAD_LEFT);

        $qt = new QuyTacTichDiem();
        $qt->MaQuyTac     = $maQT;
        $qt->SoTienQuyDoi = $data['SoTienQuyDoi'];
        $qt->SoDiemNhan   = $data['SoDiemNhan'];
        $qt->NgayApDung   = $data['NgayApDung'];
        $qt->NgayHetHan   = $data['NgayHetHan'] ?: null;
        $qt->TrangThai    = 'HoatDong';
        $qt->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm quy tắc thành công',
            'data'    => $qt,
        ], 201);
    }

    /**
     * Cập nhật quy tắc (không đổi trạng thái ở đây, dùng nút bật/tắt riêng).
     */
    public function update(Request $request, string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        $data = $this->validateData($request);

        $qt->SoTienQuyDoi = $data['SoTienQuyDoi'];
        $qt->SoDiemNhan   = $data['SoDiemNhan'];
        $qt->NgayApDung   = $data['NgayApDung'];
        $qt->NgayHetHan   = $data['NgayHetHan'] ?: null;
        $qt->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật quy tắc thành công',
            'data'    => $qt,
        ]);
    }

    /**
     * Bật / tắt quy tắc (HoatDong <-> NgungApDung).
     */
    public function toggleTrangThai(string $ma)
    {
        $qt = QuyTacTichDiem::find($ma);

        if (!$qt) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy quy tắc'], 404);
        }

        $qt->TrangThai = $qt->TrangThai === 'HoatDong' ? 'NgungApDung' : 'HoatDong';
        $qt->save();

        return response()->json([
            'success' => true,
            'message' => $qt->TrangThai === 'HoatDong' ? 'Đã kích hoạt quy tắc' : 'Đã ngừng quy tắc',
            'data'    => $qt,
        ]);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'SoTienQuyDoi' => ['required', 'numeric', 'gt:0'],
            'SoDiemNhan'   => ['required', 'integer', 'min:0'],
            'NgayApDung'   => ['required', 'date'],
            'NgayHetHan'   => ['nullable', 'date', 'after_or_equal:NgayApDung'],
        ]);
    }
}
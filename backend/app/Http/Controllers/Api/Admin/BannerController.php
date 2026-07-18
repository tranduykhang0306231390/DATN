<?php
// app/Http/Controllers/Api/Admin/BannerController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    /**
     * Danh sách toàn bộ banner.
     */
    public function index()
    {
        $data = Banner::orderBy('ThuTu')->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $last = Banner::orderBy('MaBanner', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaBanner, 2)) + 1 : 1;

        $banner = new Banner();
        $banner->MaBanner  = 'BN' . str_pad($so, 3, '0', STR_PAD_LEFT);
        $banner->TieuDe    = $data['TieuDe'];
        $banner->HinhAnh   = $data['HinhAnh'];
        $banner->Link      = $data['Link'] ?: null;
        $banner->ThuTu     = $data['ThuTu'];
        $banner->TrangThai = 1;
        $banner->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm banner thành công',
            'data'    => $banner,
        ], 201);
    }

    public function update(Request $request, string $ma)
    {
        $banner = Banner::find($ma);

        if (!$banner) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy banner'], 404);
        }

        $data = $this->validateData($request);

        $banner->TieuDe  = $data['TieuDe'];
        $banner->HinhAnh = $data['HinhAnh'];
        $banner->Link    = $data['Link'] ?: null;
        $banner->ThuTu   = $data['ThuTu'];
        $banner->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật banner thành công',
            'data'    => $banner,
        ]);
    }

    /**
     * Bật / tắt hiển thị banner (1 <-> 0).
     */
    public function toggleTrangThai(string $ma)
    {
        $banner = Banner::find($ma);

        if (!$banner) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy banner'], 404);
        }

        $banner->TrangThai = $banner->TrangThai == 1 ? 0 : 1;
        $banner->save();

        return response()->json([
            'success' => true,
            'message' => $banner->TrangThai == 1 ? 'Đã hiện banner' : 'Đã ẩn banner',
            'data'    => $banner,
        ]);
    }

    public function destroy(string $ma)
    {
        $banner = Banner::find($ma);

        if (!$banner) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy banner'], 404);
        }

        $banner->delete();

        return response()->json(['success' => true, 'message' => 'Đã xóa banner']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'TieuDe'  => ['required', 'string', 'max:255'],
            'HinhAnh' => ['required', 'string', 'max:255'],
            'Link'    => ['nullable', 'string', 'max:255'],
            'ThuTu'   => ['required', 'integer', 'min:1'],
        ]);
    }
}
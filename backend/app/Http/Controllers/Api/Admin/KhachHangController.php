<?php
// app/Http/Controllers/Api/Admin/KhachHangController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class KhachHangController extends Controller
{
    /**
     * Danh sách hạng để chọn khi sửa khách hàng.
     * Đăng ký route này TRƯỚC route /khach-hang/{ma}.
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
     * Danh sách khách hàng (tìm + lọc hạng/trạng thái + phân trang).
     * params: search, hang, trang_thai, per_page, page
     */
    public function index(Request $request)
    {
        $query = KhachHang::with('hangThanhVien');

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('HoTen', 'like', "%{$kw}%")
                    ->orWhere('SoDienThoai', 'like', "%{$kw}%")
                    ->orWhere('Email', 'like', "%{$kw}%")
                    ->orWhere('MaKhachHang', 'like', "%{$kw}%");
            });
        }
        if ($hang = $request->query('hang')) {
            $query->where('MaHangThanhVien', $hang);
        }
        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaKhachHang', 'desc');

        $perPage   = max(1, min(100, (int) $request->query('per_page', 10)));
        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(fn ($kh) => $kh->makeHidden('MatKhau'));

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
        $kh = KhachHang::with('hangThanhVien')->find($ma);

        if (!$kh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy khách hàng'], 404);
        }

        return response()->json(['success' => true, 'data' => $kh->makeHidden('MatKhau')]);
    }

    /**
     * Cập nhật thông tin khách hàng.
     * Không đổi TongDiem (điểm phải qua giao dịch) và không đổi TrangThai ở đây
     * (dùng nút khóa/mở riêng).
     */
    public function update(Request $request, string $ma)
    {
        $kh = KhachHang::find($ma);

        if (!$kh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy khách hàng'], 404);
        }

        $data = $request->validate([
            'HoTen'           => ['required', 'string', 'max:100'],
            'NgaySinh'        => ['nullable', 'date'],
            'GioiTinh'        => ['nullable', Rule::in(['Nam', 'Nu'])],
            'Email'           => ['nullable', 'email', 'max:100', Rule::unique('khachhang', 'Email')->ignore($ma, 'MaKhachHang')],
            'SoDienThoai'     => ['required', 'string', 'max:15', Rule::unique('khachhang', 'SoDienThoai')->ignore($ma, 'MaKhachHang')],
            'MaHangThanhVien' => ['required', 'exists:hangthanhvien,MaHangThanhVien'],
        ]);

        $kh->HoTen           = $data['HoTen'];
        $kh->NgaySinh        = $data['NgaySinh'] ?: null;
        $kh->GioiTinh        = $data['GioiTinh'] ?: null;
        $kh->Email           = $data['Email'] ?: null;
        $kh->SoDienThoai     = $data['SoDienThoai'];
        $kh->MaHangThanhVien = $data['MaHangThanhVien'];
        $kh->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật khách hàng thành công',
            'data'    => $kh->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Khóa / mở tài khoản khách hàng (HoatDong <-> TamKhoa).
     */
    public function toggleTrangThai(string $ma)
    {
        $kh = KhachHang::find($ma);

        if (!$kh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy khách hàng'], 404);
        }

        $kh->TrangThai = $kh->TrangThai === 'HoatDong' ? 'TamKhoa' : 'HoatDong';
        $kh->save();

        return response()->json([
            'success' => true,
            'message' => $kh->TrangThai === 'HoatDong' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
            'data'    => $kh->makeHidden('MatKhau'),
        ]);
    }
}
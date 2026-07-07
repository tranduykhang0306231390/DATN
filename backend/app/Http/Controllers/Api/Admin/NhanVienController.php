<?php
// app/Http/Controllers/Api/Admin/NhanVienController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NhanVien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class NhanVienController extends Controller
{
    
    public function index(Request $request)
    {
        $query = NhanVien::query();

        if ($kw = trim((string) $request->query('search'))) {
            $query->where(function ($sub) use ($kw) {
                $sub->where('HoTen', 'like', "%{$kw}%")
                    ->orWhere('TenDangNhap', 'like', "%{$kw}%")
                    ->orWhere('MaNhanVien', 'like', "%{$kw}%");
            });
        }

        if ($vt = $request->query('vai_tro')) {
            $query->where('VaiTro', $vt);
        }

        if ($tt = $request->query('trang_thai')) {
            $query->where('TrangThai', $tt);
        }

        $query->orderBy('MaNhanVien');

        $perPage   = max(1, min(100, (int) $request->query('per_page', 10)));
        $paginator = $query->paginate($perPage);

        // tắt hiển thị mật khẩu 
        $paginator->getCollection()->transform(
            fn ($nv) => $nv->makeHidden('MatKhau')
        );

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
     * Chi tiết một nhân viên.
     */
    public function show(string $ma)
    {
        $nv = NhanVien::find($ma);

        if (!$nv) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $nv->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Thêm nhân viên mới.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'TenDangNhap' => ['required', 'string', 'max:50', Rule::unique('nhanvien', 'TenDangNhap')],
            'MatKhau'     => ['required', 'string', 'min:6'],
            'HoTen'       => ['required', 'string', 'max:100'],
            'VaiTro'      => ['required', Rule::in(['Admin', 'NhanVien'])],
            'TrangThai'   => ['nullable', Rule::in(['HoatDong', 'TamKhoa'])],
        ]);

        // Sinh mã: NV + số thứ tự 3 chữ số
        $last = NhanVien::orderBy('MaNhanVien', 'desc')->first();
        $so   = $last ? ((int) substr($last->MaNhanVien, 2)) + 1 : 1;
        $maNV = 'NV' . str_pad($so, 3, '0', STR_PAD_LEFT);

        // Gán trực tiếp thay vì mass-assignment để không phụ thuộc $fillable
        $nv = new NhanVien();
        $nv->MaNhanVien = $maNV;
        $nv->TenDangNhap = $data['TenDangNhap'];
        $nv->MatKhau     = Hash::make($data['MatKhau']);
        $nv->HoTen       = $data['HoTen'];
        $nv->VaiTro      = $data['VaiTro'];
        $nv->TrangThai   = $data['TrangThai'] ?? 'HoatDong';
        $nv->save();

        return response()->json([
            'success' => true,
            'message' => 'Thêm nhân viên thành công',
            'data'    => $nv->makeHidden('MatKhau'),
        ], 201);
    }

    /**
     * Cập nhật nhân viên. Bỏ trống MatKhau nếu không đổi mật khẩu.
     */
    public function update(Request $request, string $ma)
    {
        $nv = NhanVien::find($ma);

        if (!$nv) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên',
            ], 404);
        }

        $data = $request->validate([
            'TenDangNhap' => ['required', 'string', 'max:50', Rule::unique('nhanvien', 'TenDangNhap')->ignore($ma, 'MaNhanVien')],
            'MatKhau'     => ['nullable', 'string', 'min:6'],
            'HoTen'       => ['required', 'string', 'max:100'],
            'VaiTro'      => ['required', Rule::in(['Admin', 'NhanVien'])],
            'TrangThai'   => ['required', Rule::in(['HoatDong', 'TamKhoa'])],
        ]);

        // Không cho tự khóa hoặc tự hạ quyền chính mình để tránh mất quyền admin
        $current = auth('nhanvien')->user();
        if ($current && $current->MaNhanVien === $ma) {
            if ($data['TrangThai'] === 'TamKhoa') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tự khóa tài khoản của chính mình',
                ], 422);
            }
            if ($data['VaiTro'] !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tự hạ quyền admin của chính mình',
                ], 422);
            }
        }

        $nv->TenDangNhap = $data['TenDangNhap'];
        $nv->HoTen       = $data['HoTen'];
        $nv->VaiTro      = $data['VaiTro'];
        $nv->TrangThai   = $data['TrangThai'];
        if (!empty($data['MatKhau'])) {
            $nv->MatKhau = Hash::make($data['MatKhau']);
        }
        $nv->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhân viên thành công',
            'data'    => $nv->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Khóa / mở khóa nhân viên (đảo trạng thái).
     */
    public function toggleTrangThai(string $ma)
    {
        $nv = NhanVien::find($ma);

        if (!$nv) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên',
            ], 404);
        }

        $current = auth('nhanvien')->user();
        if ($current && $current->MaNhanVien === $ma && $nv->TrangThai === 'HoatDong') {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tự khóa tài khoản của chính mình',
            ], 422);
        }

        $nv->TrangThai = $nv->TrangThai === 'HoatDong' ? 'TamKhoa' : 'HoatDong';
        $nv->save();

        return response()->json([
            'success' => true,
            'message' => $nv->TrangThai === 'HoatDong'
                ? 'Đã mở khóa nhân viên'
                : 'Đã khóa nhân viên',
            'data'    => $nv->makeHidden('MatKhau'),
        ]);
    }
}

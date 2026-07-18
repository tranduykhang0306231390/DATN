<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NhanVien;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class NhanVienController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'vai_tro' => ['nullable', Rule::in(['Admin', 'NhanVien'])],
            'trang_thai' => ['nullable', Rule::in(['HoatDong', 'TamKhoa'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = NhanVien::query();
        if ($keyword = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('HoTen', 'like', "%{$keyword}%")
                    ->orWhere('TenDangNhap', 'like', "%{$keyword}%")
                    ->orWhere('MaNhanVien', 'like', "%{$keyword}%");
            });
        }
        if (!empty($filters['vai_tro'])) {
            $query->where('VaiTro', $filters['vai_tro']);
        }
        if (!empty($filters['trang_thai'])) {
            $query->where('TrangThai', $filters['trang_thai']);
        }

        $paginator = $query->orderBy('MaNhanVien')->paginate($filters['per_page'] ?? 10);
        $paginator->getCollection()->transform(fn ($staff) => $staff->makeHidden('MatKhau'));

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $ma)
    {
        $staff = NhanVien::find($ma);
        if (!$staff) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy nhân viên'], 404);
        }

        return response()->json(['success' => true, 'data' => $staff->makeHidden('MatKhau')]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'TenDangNhap' => ['required', 'string', 'max:50', Rule::unique('nhanvien', 'TenDangNhap')],
            'MatKhau' => ['required', 'string', 'min:8', 'max:72'],
            'HoTen' => ['required', 'string', 'max:100'],
            'VaiTro' => ['required', Rule::in(['Admin', 'NhanVien'])],
            'TrangThai' => ['nullable', Rule::in(['HoatDong', 'TamKhoa'])],
        ]);

        $staff = DB::transaction(function () use ($data) {
            $staff = new NhanVien();
            $staff->MaNhanVien = $this->codes->next('nhanvien', 'MaNhanVien', 'NV');
            $staff->TenDangNhap = trim($data['TenDangNhap']);
            $staff->MatKhau = Hash::make($data['MatKhau']);
            $staff->HoTen = trim($data['HoTen']);
            $staff->VaiTro = $data['VaiTro'];
            $staff->TrangThai = $data['TrangThai'] ?? 'HoatDong';
            $staff->save();

            return $staff;
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm nhân viên thành công',
            'data' => $staff->makeHidden('MatKhau'),
        ], 201);
    }

    public function update(Request $request, string $ma)
    {
        $data = $request->validate([
            'TenDangNhap' => [
                'required',
                'string',
                'max:50',
                Rule::unique('nhanvien', 'TenDangNhap')->ignore($ma, 'MaNhanVien'),
            ],
            'MatKhau' => ['nullable', 'string', 'min:8', 'max:72'],
            'HoTen' => ['required', 'string', 'max:100'],
            'VaiTro' => ['required', Rule::in(['Admin', 'NhanVien'])],
            'TrangThai' => ['required', Rule::in(['HoatDong', 'TamKhoa'])],
        ]);
        $currentStaffId = auth('nhanvien')->id();

        $result = DB::transaction(function () use ($currentStaffId, $data, $ma) {
            // Khóa toàn bộ admin hoạt động theo cùng thứ tự để hai thao tác đồng
            // thời không thể cùng loại bỏ admin cuối cùng.
            $activeAdminIds = NhanVien::where('VaiTro', 'Admin')
                ->where('TrangThai', 'HoatDong')
                ->orderBy('MaNhanVien')
                ->lockForUpdate()
                ->pluck('MaNhanVien');
            $staff = NhanVien::where('MaNhanVien', $ma)->lockForUpdate()->first();

            if (!$staff) return ['error' => 'not_found'];

            if ($currentStaffId === $ma && $data['TrangThai'] === 'TamKhoa') {
                return ['error' => 'self_lock'];
            }
            if ($currentStaffId === $ma && $data['VaiTro'] !== 'Admin') {
                return ['error' => 'self_demote'];
            }

            $removesActiveAdmin = $staff->VaiTro === 'Admin'
                && $staff->TrangThai === 'HoatDong'
                && ($data['VaiTro'] !== 'Admin' || $data['TrangThai'] !== 'HoatDong');
            if ($removesActiveAdmin && $activeAdminIds->count() <= 1) {
                return ['error' => 'last_admin'];
            }

            $staff->TenDangNhap = trim($data['TenDangNhap']);
            $staff->HoTen = trim($data['HoTen']);
            $staff->VaiTro = $data['VaiTro'];
            $staff->TrangThai = $data['TrangThai'];
            if (!empty($data['MatKhau'])) {
                $staff->MatKhau = Hash::make($data['MatKhau']);
            }
            $staff->save();

            return ['staff' => $staff];
        });

        if (isset($result['error'])) {
            return $this->staffMutationError($result['error']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhân viên thành công',
            'data' => $result['staff']->makeHidden('MatKhau'),
        ]);
    }

    public function toggleTrangThai(string $ma)
    {
        $currentStaffId = auth('nhanvien')->id();

        $result = DB::transaction(function () use ($currentStaffId, $ma) {
            $activeAdminIds = NhanVien::where('VaiTro', 'Admin')
                ->where('TrangThai', 'HoatDong')
                ->orderBy('MaNhanVien')
                ->lockForUpdate()
                ->pluck('MaNhanVien');
            $staff = NhanVien::where('MaNhanVien', $ma)->lockForUpdate()->first();

            if (!$staff) return ['error' => 'not_found'];
            if ($currentStaffId === $ma && $staff->TrangThai === 'HoatDong') {
                return ['error' => 'self_lock'];
            }
            if (
                $staff->VaiTro === 'Admin'
                && $staff->TrangThai === 'HoatDong'
                && $activeAdminIds->count() <= 1
            ) {
                return ['error' => 'last_admin'];
            }

            $staff->TrangThai = $staff->TrangThai === 'HoatDong' ? 'TamKhoa' : 'HoatDong';
            $staff->save();

            return ['staff' => $staff];
        });

        if (isset($result['error'])) {
            return $this->staffMutationError($result['error']);
        }

        $staff = $result['staff'];
        return response()->json([
            'success' => true,
            'message' => $staff->TrangThai === 'HoatDong'
                ? 'Đã mở khóa nhân viên'
                : 'Đã khóa nhân viên',
            'data' => $staff->makeHidden('MatKhau'),
        ]);
    }

    private function staffMutationError(string $error)
    {
        return match ($error) {
            'not_found' => response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên',
            ], 404),
            'self_lock' => response()->json([
                'success' => false,
                'message' => 'Không thể tự khóa tài khoản của chính mình',
            ], 422),
            'self_demote' => response()->json([
                'success' => false,
                'message' => 'Không thể tự hạ quyền admin của chính mình',
            ], 422),
            default => response()->json([
                'success' => false,
                'message' => 'Hệ thống phải luôn có ít nhất một admin đang hoạt động.',
            ], 422),
        };
    }
}

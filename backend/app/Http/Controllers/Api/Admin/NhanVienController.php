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
    ) {
    }

    /**
     * Danh sách tài khoản nhân viên.
     *
     * Không trả về tài khoản Admin vì tài khoản Admin
     * được quản lý riêng tại khu vực thông tin Admin.
     *
     * Query params:
     * - search
     * - trang_thai
     * - per_page
     * - page
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'trang_thai' => [
                'nullable',
                Rule::in([
                    'HoatDong',
                    'TamKhoa',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'between:1,100',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        /*
         * Luôn giới hạn VaiTro = NhanVien ở backend.
         * Không chỉ dựa vào việc frontend ẩn tài khoản Admin.
         */
        $query = NhanVien::query()
            ->where('VaiTro', 'NhanVien');

        $keyword = trim(
            (string) ($filters['search'] ?? '')
        );

        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where(
                        'HoTen',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'TenDangNhap',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'MaNhanVien',
                        'like',
                        "%{$keyword}%"
                    );
            });
        }

        if (!empty($filters['trang_thai'])) {
            $query->where(
                'TrangThai',
                $filters['trang_thai']
            );
        }

        $query->orderBy('MaNhanVien');

        $paginator = $query->paginate(
            $filters['per_page'] ?? 10
        );

        $paginator
            ->getCollection()
            ->transform(
                fn (NhanVien $nhanVien) =>
                    $nhanVien->makeHidden('MatKhau')
            );

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

    /**
     * Xem chi tiết một tài khoản nhân viên.
     *
     * Không cho phép truy xuất tài khoản Admin qua endpoint này.
     */
    public function show(string $ma)
    {
        $nhanVien = NhanVien::query()
            ->where('MaNhanVien', $ma)
            ->where('VaiTro', 'NhanVien')
            ->first();

        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $nhanVien->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Tạo tài khoản nhân viên.
     *
     * VaiTro được backend cố định là NhanVien.
     * Không cho phép tạo tài khoản Admin từ chức năng này.
     */
    public function store(Request $request)
    {
        $this->normalizeRequest($request);

        $data = $request->validate(
            [
                'TenDangNhap' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique(
                        'nhanvien',
                        'TenDangNhap'
                    ),
                ],

                'MatKhau' => [
                    'required',
                    'string',
                    'min:8',
                    'max:72',
                ],

                'HoTen' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'TrangThai' => [
                    'nullable',
                    Rule::in([
                        'HoatDong',
                        'TamKhoa',
                    ]),
                ],

                /*
                 * Chặn frontend cũ hoặc request thủ công
                 * cố gắng tạo tài khoản Admin.
                 */
                'VaiTro' => [
                    'prohibited',
                ],
            ],
            [
                'TenDangNhap.required' =>
                    'Vui lòng nhập tên đăng nhập.',

                'TenDangNhap.unique' =>
                    'Tên đăng nhập này đã được sử dụng.',

                'MatKhau.required' =>
                    'Vui lòng nhập mật khẩu.',

                'MatKhau.min' =>
                    'Mật khẩu phải có ít nhất 8 ký tự.',

                'HoTen.required' =>
                    'Vui lòng nhập họ và tên nhân viên.',

                'TrangThai.in' =>
                    'Trạng thái tài khoản không hợp lệ.',

                'VaiTro.prohibited' =>
                    'Không được thiết lập vai trò tại chức năng quản lý nhân viên.',
            ]
        );

        $nhanVien = DB::transaction(
            function () use ($data) {
                $nhanVien = new NhanVien();

                $nhanVien->MaNhanVien =
                    $this->codes->next(
                        'nhanvien',
                        'MaNhanVien',
                        'NV'
                    );

                $nhanVien->TenDangNhap =
                    trim($data['TenDangNhap']);

                $nhanVien->MatKhau =
                    Hash::make($data['MatKhau']);

                $nhanVien->HoTen =
                    trim($data['HoTen']);

                /*
                 * Vai trò luôn được cố định ở backend.
                 */
                $nhanVien->VaiTro = 'NhanVien';

                $nhanVien->TrangThai =
                    $data['TrangThai'] ?? 'HoatDong';

                $nhanVien->save();

                return $nhanVien;
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm nhân viên thành công.',
            'data' => $nhanVien->makeHidden('MatKhau'),
        ], 201);
    }

    /**
     * Cập nhật tài khoản nhân viên.
     *
     * Chỉ cập nhật tài khoản có VaiTro = NhanVien.
     * Không thể dùng endpoint này để chỉnh sửa tài khoản Admin.
     */
    public function update(
        Request $request,
        string $ma
    ) {
        $this->normalizeRequest($request);

        $data = $request->validate(
            [
                'TenDangNhap' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique(
                        'nhanvien',
                        'TenDangNhap'
                    )->ignore(
                        $ma,
                        'MaNhanVien'
                    ),
                ],

                'MatKhau' => [
                    'nullable',
                    'string',
                    'min:8',
                    'max:72',
                ],

                'HoTen' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'TrangThai' => [
                    'required',
                    Rule::in([
                        'HoatDong',
                        'TamKhoa',
                    ]),
                ],

                /*
                 * Vai trò nhân viên không được chỉnh sửa từ form.
                 */
                'VaiTro' => [
                    'prohibited',
                ],
            ],
            [
                'TenDangNhap.required' =>
                    'Vui lòng nhập tên đăng nhập.',

                'TenDangNhap.unique' =>
                    'Tên đăng nhập này đã được sử dụng.',

                'MatKhau.min' =>
                    'Mật khẩu phải có ít nhất 8 ký tự.',

                'HoTen.required' =>
                    'Vui lòng nhập họ và tên nhân viên.',

                'TrangThai.required' =>
                    'Vui lòng chọn trạng thái tài khoản.',

                'TrangThai.in' =>
                    'Trạng thái tài khoản không hợp lệ.',

                'VaiTro.prohibited' =>
                    'Không được thay đổi vai trò tại chức năng quản lý nhân viên.',
            ]
        );

        $nhanVien = DB::transaction(
            function () use ($data, $ma) {
                $nhanVien = NhanVien::query()
                    ->where('MaNhanVien', $ma)
                    ->where('VaiTro', 'NhanVien')
                    ->lockForUpdate()
                    ->first();

                if (!$nhanVien) {
                    return null;
                }

                $nhanVien->TenDangNhap =
                    trim($data['TenDangNhap']);

                $nhanVien->HoTen =
                    trim($data['HoTen']);

                $nhanVien->TrangThai =
                    $data['TrangThai'];

                if (!empty($data['MatKhau'])) {
                    $nhanVien->MatKhau =
                        Hash::make($data['MatKhau']);
                }

                /*
                 * Không gán VaiTro từ request.
                 * Tài khoản vẫn giữ VaiTro = NhanVien.
                 */
                $nhanVien->save();

                return $nhanVien;
            }
        );

        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhân viên thành công.',
            'data' => $nhanVien->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Khóa hoặc mở tài khoản nhân viên.
     *
     * Chỉ áp dụng với tài khoản có VaiTro = NhanVien.
     */
    public function toggleTrangThai(string $ma)
    {
        $nhanVien = DB::transaction(
            function () use ($ma) {
                $nhanVien = NhanVien::query()
                    ->where('MaNhanVien', $ma)
                    ->where('VaiTro', 'NhanVien')
                    ->lockForUpdate()
                    ->first();

                if (!$nhanVien) {
                    return null;
                }

                $nhanVien->TrangThai =
                    $nhanVien->TrangThai === 'HoatDong'
                        ? 'TamKhoa'
                        : 'HoatDong';

                $nhanVien->save();

                return $nhanVien;
            }
        );

        if (!$nhanVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nhân viên.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' =>
                $nhanVien->TrangThai === 'HoatDong'
                    ? 'Đã mở khóa nhân viên.'
                    : 'Đã khóa nhân viên.',
            'data' => $nhanVien->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Chuẩn hóa chuỗi trước khi validation.
     *
     * Điều này giúp việc kiểm tra unique không bị sai
     * do khoảng trắng đầu hoặc cuối.
     */
    private function normalizeRequest(Request $request): void
    {
        $normalized = [];

        if ($request->has('TenDangNhap')) {
            $normalized['TenDangNhap'] = trim(
                (string) $request->input('TenDangNhap')
            );
        }

        if ($request->has('HoTen')) {
            $normalized['HoTen'] = trim(
                (string) $request->input('HoTen')
            );
        }

        if ($request->has('MatKhau')) {
            $matKhau = $request->input('MatKhau');

            /*
             * Khi cập nhật, frontend có thể gửi chuỗi rỗng
             * để biểu thị không thay đổi mật khẩu.
             */
            $normalized['MatKhau'] =
                is_string($matKhau) && trim($matKhau) === ''
                    ? null
                    : $matKhau;
        }

        if ($normalized !== []) {
            $request->merge($normalized);
        }
    }
}
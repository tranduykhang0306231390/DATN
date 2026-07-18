<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\KhachHang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class KhachHangController extends Controller
{
    /**
     * Danh sách hạng thành viên phục vụ bộ lọc và hiển thị.
     *
     * Endpoint này không dùng để thay đổi hạng khách hàng.
     * Hạng thành viên phải được hệ thống tự động nâng theo nghiệp vụ.
     */
    public function tuyChon()
    {
        $hangThanhVien = DB::table('hangthanhvien')
            ->select([
                'MaHangThanhVien',
                'TenHang',
            ])
            ->orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'hangThanhVien' => $hangThanhVien,
            ],
        ]);
    }

    /**
     * Danh sách khách hàng.
     *
     * Query params:
     * - search
     * - hang
     * - trang_thai
     * - per_page
     * - page
     */
    public function index(Request $request)
    {
        $query = KhachHang::query()
            ->with('hangThanhVien');

        $keyword = trim(
            (string) $request->query('search', '')
        );

        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where('HoTen', 'like', "%{$keyword}%")
                    ->orWhere(
                        'SoDienThoai',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'Email',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'MaKhachHang',
                        'like',
                        "%{$keyword}%"
                    );
            });
        }

        $maHang = trim(
            (string) $request->query('hang', '')
        );

        if ($maHang !== '') {
            $query->where(
                'MaHangThanhVien',
                $maHang
            );
        }

        $trangThai = trim(
            (string) $request->query('trang_thai', '')
        );

        if ($trangThai !== '') {
            $query->where(
                'TrangThai',
                $trangThai
            );
        }

        $query->orderByDesc('MaKhachHang');

        $perPage = max(
            1,
            min(
                100,
                (int) $request->query('per_page', 10)
            )
        );

        $paginator = $query->paginate($perPage);

        $paginator
            ->getCollection()
            ->transform(
                fn (KhachHang $khachHang) =>
                    $khachHang->makeHidden('MatKhau')
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
     * Xem chi tiết khách hàng.
     */
    public function show(string $ma)
    {
        $khachHang = KhachHang::query()
            ->with('hangThanhVien')
            ->find($ma);

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $khachHang->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Cập nhật thông tin cá nhân khách hàng.
     *
     * Không cho phép Admin thay đổi hạng thành viên tại endpoint này.
     * Hạng thành viên phải được hệ thống tự động nâng theo tổng điểm,
     * tổng chi tiêu và nghiệp vụ đang áp dụng.
     */
    public function update(
        Request $request,
        string $ma
    ) {
        $khachHangTonTai = KhachHang::query()
            ->where('MaKhachHang', $ma)
            ->exists();

        if (!$khachHangTonTai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng.',
            ], 404);
        }

        $data = $request->validate(
            [
                'HoTen' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'NgaySinh' => [
                    'nullable',
                    'date',
                    'before_or_equal:today',
                ],

                'GioiTinh' => [
                    'nullable',
                    Rule::in([
                        'Nam',
                        'Nu',
                    ]),
                ],

                'Email' => [
                    'required',
                    'email',
                    'max:100',
                    Rule::unique(
                        'khachhang',
                        'Email'
                    )->ignore(
                        $ma,
                        'MaKhachHang'
                    ),
                ],

                'SoDienThoai' => [
                    'required',
                    'regex:/^0[0-9]{9}$/',
                    Rule::unique(
                        'khachhang',
                        'SoDienThoai'
                    )->ignore(
                        $ma,
                        'MaKhachHang'
                    ),
                ],

                /*
                 * Không cho phép gửi các trường thay đổi hạng thủ công.
                 */
                'MaHangThanhVien' => [
                    'prohibited',
                ],

                'LyDoThayDoi' => [
                    'prohibited',
                ],
            ],
            [
                'HoTen.required' =>
                    'Vui lòng nhập họ và tên khách hàng.',

                'NgaySinh.before_or_equal' =>
                    'Ngày sinh không được lớn hơn ngày hiện tại.',

                'GioiTinh.in' =>
                    'Giới tính không hợp lệ.',

                'Email.required' =>
                    'Vui lòng nhập email khách hàng.',

                'Email.email' =>
                    'Email không đúng định dạng.',

                'Email.unique' =>
                    'Email này đã được sử dụng.',

                'SoDienThoai.required' =>
                    'Vui lòng nhập số điện thoại khách hàng.',

                'SoDienThoai.regex' =>
                    'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.',

                'SoDienThoai.unique' =>
                    'Số điện thoại này đã được sử dụng.',

                'MaHangThanhVien.prohibited' =>
                    'Không được chỉnh sửa hạng thành viên thủ công.',

                'LyDoThayDoi.prohibited' =>
                    'Không được tạo lịch sử thay đổi hạng thủ công.',
            ]
        );

        try {
            $khachHang = DB::transaction(
                function () use ($data, $ma) {
                    $khachHang = KhachHang::query()
                        ->where('MaKhachHang', $ma)
                        ->lockForUpdate()
                        ->first();

                    if (!$khachHang) {
                        return null;
                    }

                    $khachHang->HoTen = trim(
                        $data['HoTen']
                    );

                    $khachHang->NgaySinh =
                        $data['NgaySinh'] ?? null;

                    $khachHang->GioiTinh =
                        $data['GioiTinh'] ?? null;

                    $khachHang->Email = strtolower(
                        trim($data['Email'])
                    );

                    $khachHang->SoDienThoai = trim(
                        $data['SoDienThoai']
                    );

                    /*
                     * Không gán MaHangThanhVien tại đây.
                     * Giá trị hạng hiện tại được giữ nguyên.
                     */
                    $khachHang->save();

                    return $khachHang;
                }
            );

            if (!$khachHang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy khách hàng.',
                ], 404);
            }

            $khachHang->load('hangThanhVien');

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật khách hàng thành công.',
                'data' => $khachHang->makeHidden('MatKhau'),
            ]);
        } catch (\Throwable $exception) {
            Log::error(
                'Không thể cập nhật khách hàng',
                [
                    'customer_id' => $ma,
                    'staff_id' => auth('nhanvien')->id(),
                    'exception' => $exception,
                ]
            );

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể cập nhật khách hàng lúc này. Vui lòng thử lại.',
            ], 500);
        }
    }

    /**
     * Khóa hoặc mở tài khoản khách hàng.
     *
     * HoatDong <-> TamKhoa
     */
    public function toggleTrangThai(string $ma)
    {
        $khachHang = DB::transaction(
            function () use ($ma) {
                $khachHang = KhachHang::query()
                    ->where('MaKhachHang', $ma)
                    ->lockForUpdate()
                    ->first();

                if (!$khachHang) {
                    return null;
                }

                $khachHang->TrangThai =
                    $khachHang->TrangThai === 'HoatDong'
                        ? 'TamKhoa'
                        : 'HoatDong';

                $khachHang->save();

                return $khachHang;
            }
        );

        if (!$khachHang) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' =>
                $khachHang->TrangThai === 'HoatDong'
                    ? 'Đã mở khóa tài khoản.'
                    : 'Đã khóa tài khoản.',
            'data' => $khachHang->makeHidden('MatKhau'),
        ]);
    }

    /**
     * Lịch sử thay đổi hạng thành viên.
     *
     * Chỉ đọc. Việc ghi lịch sử được thực hiện bởi quy trình
     * tự động nâng hạng của hệ thống.
     */
    public function lichSuHang(Request $request)
    {
        $query = DB::table('lichsuhangthanhvien as ls')
            ->leftJoin(
                'khachhang as kh',
                'ls.MaKhachHang',
                '=',
                'kh.MaKhachHang'
            )
            ->leftJoin(
                'hangthanhvien as hc',
                'ls.MaHangThanhVienCu',
                '=',
                'hc.MaHangThanhVien'
            )
            ->leftJoin(
                'hangthanhvien as hm',
                'ls.MaHangThanhVienMoi',
                '=',
                'hm.MaHangThanhVien'
            )
            ->select([
                'ls.*',
                'kh.HoTen as TenKhachHang',
                'hc.TenHang as TenHangCu',
                'hm.TenHang as TenHangMoi',
            ]);

        $maKhachHang = trim(
            (string) $request->query(
                'ma_khach_hang',
                ''
            )
        );

        if ($maKhachHang !== '') {
            $query->where(
                'ls.MaKhachHang',
                'like',
                "%{$maKhachHang}%"
            );
        }

        $query->orderByDesc('ls.MaLichSuHang');

        $perPage = max(
            1,
            min(
                100,
                (int) $request->query('per_page', 10)
            )
        );

        $paginator = $query->paginate($perPage);

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
     * Lịch sử giao dịch điểm.
     */
    public function lichSuDiem(Request $request)
    {
        $query = DB::table('lichsugiaodichdiem as ls')
            ->leftJoin(
                'khachhang as kh',
                'ls.MaKhachHang',
                '=',
                'kh.MaKhachHang'
            )
            ->select([
                'ls.*',
                'kh.HoTen as TenKhachHang',
            ]);

        $maKhachHang = trim(
            (string) $request->query(
                'ma_khach_hang',
                ''
            )
        );

        if ($maKhachHang !== '') {
            $query->where(
                'ls.MaKhachHang',
                'like',
                "%{$maKhachHang}%"
            );
        }

        $loaiGiaoDich = trim(
            (string) $request->query(
                'loai_giao_dich',
                ''
            )
        );

        if ($loaiGiaoDich !== '') {
            $query->where(
                'ls.LoaiGiaoDich',
                $loaiGiaoDich
            );
        }

        /*
         * Sắp theo phần số của mã GDD thay vì chuỗi ký tự.
         * Ví dụ GDD100 phải mới hơn GDD99.
         */
        $query->orderByRaw(
            'CAST(SUBSTRING(ls.MaGiaoDichDiem, 4) AS UNSIGNED) DESC'
        );

        $perPage = max(
            1,
            min(
                100,
                (int) $request->query('per_page', 10)
            )
        );

        $paginator = $query->paginate($perPage);

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
}
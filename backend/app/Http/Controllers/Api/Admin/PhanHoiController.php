<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PhanHoiController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {
    }

    /**
     * Danh sách phản hồi, hỗ trợ:
     * - Tìm kiếm
     * - Lọc trạng thái
     * - Lọc điểm đánh giá
     * - Phân trang
     *
     * Tìm kiếm theo:
     * - Mã phản hồi
     * - Mã hóa đơn
     * - Nội dung phản hồi
     * - Tên khách hàng
     * - Số điện thoại khách hàng
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
                    'ChuaXuLy',
                    'DaXuLy',
                ]),
            ],

            'diem' => [
                'nullable',
                'integer',
                'between:1,5',
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

        $query = DB::table('phanhoikhachhang as ph')
            ->leftJoin(
                'khachhang as kh',
                'ph.MaKhachHang',
                '=',
                'kh.MaKhachHang'
            )
            ->leftJoin(
                'nhanvien as nv',
                'ph.MaNhanVien',
                '=',
                'nv.MaNhanVien'
            )
            ->select([
                'ph.*',
                'kh.HoTen as TenKhachHang',
                'kh.SoDienThoai',
                'nv.HoTen as TenNhanVien',
            ]);

        $keyword = trim(
            (string) ($filters['search'] ?? '')
        );

        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where(
                        'ph.NoiDungCuaKhachHang',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'ph.MaPhanHoi',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'ph.MaHoaDon',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'kh.HoTen',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'kh.SoDienThoai',
                        'like',
                        "%{$keyword}%"
                    );
            });
        }

        if (!empty($filters['trang_thai'])) {
            $query->where(
                'ph.TrangThaiXuLy',
                $filters['trang_thai']
            );
        }

        if (isset($filters['diem'])) {
            $query->where(
                'ph.DiemDanhGia',
                $filters['diem']
            );
        }

        /*
         * Ưu tiên phản hồi chưa xử lý trước,
         * sau đó sắp theo thời gian mới nhất.
         */
        $query
            ->orderByRaw(
                "
                CASE
                    WHEN ph.TrangThaiXuLy = 'ChuaXuLy' THEN 0
                    ELSE 1
                END
                "
            )
            ->orderByDesc('ph.ThoiGian')
            ->orderByDesc('ph.MaPhanHoi');

        $paginator = $query->paginate(
            $filters['per_page'] ?? 10
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

            'thong_ke' => $this->thongKe(),
        ]);
    }

    /**
     * Xem chi tiết một phản hồi.
     */
    public function show(string $ma)
    {
        $phanHoi = DB::table('phanhoikhachhang as ph')
            ->leftJoin(
                'khachhang as kh',
                'ph.MaKhachHang',
                '=',
                'kh.MaKhachHang'
            )
            ->leftJoin(
                'nhanvien as nv',
                'ph.MaNhanVien',
                '=',
                'nv.MaNhanVien'
            )
            ->select([
                'ph.*',
                'kh.HoTen as TenKhachHang',
                'kh.SoDienThoai',
                'nv.HoTen as TenNhanVien',
            ])
            ->where('ph.MaPhanHoi', $ma)
            ->first();

        if (!$phanHoi) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phản hồi.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $phanHoi,
        ]);
    }

    /**
     * Lưu câu trả lời của nhà hàng và tạo thông báo cho khách hàng
     * trong cùng một transaction.
     */
    public function traLoi(
        Request $request,
        string $ma
    ) {
        $data = $request->validate(
            [
                'NoiDungPhanHoiCuaHang' => [
                    'required',
                    'string',
                    'max:500',
                ],
            ],
            [
                'NoiDungPhanHoiCuaHang.required' =>
                    'Vui lòng nhập nội dung phản hồi.',

                'NoiDungPhanHoiCuaHang.max' =>
                    'Nội dung phản hồi không được vượt quá 500 ký tự.',
            ]
        );

        $noiDungPhanHoi = trim(
            $data['NoiDungPhanHoiCuaHang']
        );

        if ($noiDungPhanHoi === '') {
            throw ValidationException::withMessages([
                'NoiDungPhanHoiCuaHang' => [
                    'Vui lòng nhập nội dung phản hồi.',
                ],
            ]);
        }

        $maNhanVien = auth('nhanvien')->user()?->MaNhanVien;

        if (!$maNhanVien) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không xác định được tài khoản nhân viên đang xử lý.',
            ], 401);
        }

        $updated = DB::transaction(
            function () use (
                $ma,
                $maNhanVien,
                $noiDungPhanHoi
            ) {
                $phanHoi = DB::table('phanhoikhachhang')
                    ->where('MaPhanHoi', $ma)
                    ->lockForUpdate()
                    ->first();

                if (!$phanHoi) {
                    return false;
                }

                if ($phanHoi->TrangThaiXuLy === 'DaXuLy') {
                    throw ValidationException::withMessages([
                        'NoiDungPhanHoiCuaHang' => [
                            'Phản hồi này đã được xử lý trước đó.',
                        ],
                    ]);
                }

                DB::table('phanhoikhachhang')
                    ->where('MaPhanHoi', $ma)
                    ->update([
                        'NoiDungPhanHoiCuaHang' =>
                            $noiDungPhanHoi,

                        'TrangThaiXuLy' =>
                            'DaXuLy',

                        'ThoiGianPhanHoi' =>
                            now(),

                        'MaNhanVien' =>
                            $maNhanVien,
                    ]);

                /*
                 * Chỉ tạo thông báo khi phản hồi có khách hàng hợp lệ.
                 */
                if (!empty($phanHoi->MaKhachHang)) {
                    DB::table('thongbao')->insert([
                        'MaThongBao' =>
                            $this->codes->next(
                                'thongbao',
                                'MaThongBao',
                                'TB'
                            ),

                        'TieuDe' =>
                            'Phản hồi của bạn đã được hồi đáp',

                        'NoiDung' =>
                            'Nhà hàng đã phản hồi đánh giá của bạn cho hóa đơn '
                            . $phanHoi->MaHoaDon
                            . '. Bạn có thể xem lại trong lịch sử hóa đơn.',

                        'ThoiGian' =>
                            now(),

                        'TrangThai' =>
                            'ChuaDoc',

                        'MaKhachHang' =>
                            $phanHoi->MaKhachHang,
                    ]);
                }

                return true;
            }
        );

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phản hồi.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' =>
                'Đã gửi phản hồi tới khách hàng.',
        ]);
    }

    /**
     * Thống kê tổng quan phản hồi.
     */
    private function thongKe(): array
    {
        $query = DB::table('phanhoikhachhang');

        $tong = (int) (clone $query)->count();

        $chuaXuLy = (int) (clone $query)
            ->where(
                'TrangThaiXuLy',
                'ChuaXuLy'
            )
            ->count();

        $daXuLy = (int) (clone $query)
            ->where(
                'TrangThaiXuLy',
                'DaXuLy'
            )
            ->count();

        $diemTrungBinh = (float) (
            (clone $query)->avg('DiemDanhGia') ?? 0
        );

        return [
            'tong' => $tong,
            'chua_xu_ly' => $chuaXuLy,
            'da_xu_ly' => $daXuLy,
            'diem_trung_binh' =>
                round($diemTrungBinh, 1),
        ];
    }
}
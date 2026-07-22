<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UuDai;
use App\Services\SequentialCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UuDaiController extends Controller
{
    private const NHOM = [
        'GiamTien',
        'PhanTram',
        'TangMon',
    ];

    private const TRANG_THAI = [
        'HoatDong',
        'NgungApDung',
    ];

    public function __construct(
        private SequentialCodeService $codes
    ) {
    }

    /**
     * Dữ liệu phụ cho form ưu đãi.
     *
     * Route này phải được khai báo trước:
     * /uu-dai/{ma}
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
     * Danh sách ưu đãi.
     *
     * Query params:
     * - search
     * - trang_thai
     * - nhom
     * - hang
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
                Rule::in(self::TRANG_THAI),
            ],

            'nhom' => [
                'nullable',
                Rule::in(self::NHOM),
            ],

            'hang' => [
                'nullable',
                'string',
                'exists:hangthanhvien,MaHangThanhVien',
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

        $query = UuDai::query();

        $keyword = trim(
            (string) ($filters['search'] ?? '')
        );

        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where(
                        'TenUuDai',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'MaUuDai',
                        'like',
                        "%{$keyword}%"
                    )
                    ->orWhere(
                        'MoTa',
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

        if (!empty($filters['nhom'])) {
            $query->where(
                'NhomUuDai',
                $filters['nhom']
            );
        }

        if (!empty($filters['hang'])) {
            $query->where(
                'MaHangThanhVien',
                $filters['hang']
            );
        }

        /*
         * Sắp theo phần số của mã ưu đãi.
         * Ví dụ UD100 phải mới hơn UD99.
         */
        $query->orderByRaw(
            'CAST(SUBSTRING(MaUuDai, 3) AS UNSIGNED) DESC'
        );

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
        ]);
    }

    /**
     * Xem chi tiết ưu đãi.
     */
    public function show(string $ma)
    {
        $uuDai = UuDai::find($ma);

        if (!$uuDai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ưu đãi.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $uuDai,
        ]);
    }

    /**
     * Thêm ưu đãi mới.
     *
     * Số lượng tồn ban đầu bằng số lượng phát hành.
     * Ngày bắt đầu và kết thúc không được nằm trong quá khứ.
     */
    public function store(Request $request)
    {
        $this->normalizeRequest($request);

        $data = $this->validateData($request);

        $uuDai = DB::transaction(
            function () use ($data) {
                $uuDai = new UuDai();

                $uuDai->MaUuDai =
                    $this->codes->next(
                        'uudai',
                        'MaUuDai',
                        'UD'
                    );

                $this->fillUuDai(
                    $uuDai,
                    $data
                );

                /*
                 * Khi tạo mới chưa có voucher nào được cấp.
                 */
                $uuDai->SoLuongTon =
                    (int) $data['SoLuongPhatHanh'];

                $uuDai->TrangThai = 'HoatDong';

                $uuDai->save();

                return $uuDai;
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm ưu đãi thành công.',
            'data' => $uuDai,
        ], 201);
    }

    /**
     * Cập nhật ưu đãi.
     *
     * Khi thay đổi số lượng phát hành:
     * - Giữ nguyên số voucher đã cấp.
     * - Tính lại số lượng tồn.
     * - Không cho giảm tổng phát hành thấp hơn số đã cấp.
     */
    public function update(
        Request $request,
        string $ma
    ) {
        $this->normalizeRequest($request);

        $data = $this->validateData($request);

        $uuDai = DB::transaction(
            function () use ($ma, $data) {
                $uuDai = UuDai::query()
                    ->where('MaUuDai', $ma)
                    ->lockForUpdate()
                    ->first();

                if (!$uuDai) {
                    return null;
                }

                $soLuongDaPhat = max(
                    0,
                    (int) $uuDai->SoLuongPhatHanh
                        - (int) $uuDai->SoLuongTon
                );

                $soLuongPhatHanhMoi =
                    (int) $data['SoLuongPhatHanh'];

                if ($soLuongPhatHanhMoi < $soLuongDaPhat) {
                    throw ValidationException::withMessages([
                        'SoLuongPhatHanh' => [
                            "Số lượng phát hành không thể thấp hơn {$soLuongDaPhat} voucher đã được cấp.",
                        ],
                    ]);
                }

                $this->fillUuDai(
                    $uuDai,
                    $data
                );

                $uuDai->SoLuongTon =
                    $soLuongPhatHanhMoi - $soLuongDaPhat;

                $uuDai->save();

                return $uuDai;
            }
        );

        if (!$uuDai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ưu đãi.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ưu đãi thành công.',
            'data' => $uuDai,
        ]);
    }

    /**
     * Bật hoặc ngừng áp dụng ưu đãi.
     *
     * HoatDong <-> NgungApDung
     *
     * Ưu đãi đã hết hạn (NgayKetThuc đã qua) không thể mở lại bằng cách
     * bật/tắt trạng thái — phải sửa ngày kết thúc trước. Trạng thái hiệu
     * lực của một ưu đãi hết hạn luôn là "hết hạn" bất kể cột TrangThai
     * đang lưu giá trị gì, nên không cho phép thao tác này đổi TrangThai.
     */
    public function toggleTrangThai(string $ma)
    {
        $uuDai = DB::transaction(
            function () use ($ma) {
                $uuDai = UuDai::query()
                    ->where('MaUuDai', $ma)
                    ->lockForUpdate()
                    ->first();

                if (!$uuDai) {
                    return null;
                }

                if ($uuDai->NgayKetThuc < now()->toDateString()) {
                    throw ValidationException::withMessages([
                        'TrangThai' => [
                            'Ưu đãi đã hết hạn, không thể mở/khóa. Vui lòng cập nhật lại ngày kết thúc nếu muốn tiếp tục áp dụng.',
                        ],
                    ]);
                }

                $uuDai->TrangThai =
                    $uuDai->TrangThai === 'HoatDong'
                        ? 'NgungApDung'
                        : 'HoatDong';

                $uuDai->save();

                return $uuDai;
            }
        );

        if (!$uuDai) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ưu đãi.',
            ], 404);
        }

        return response()->json([
            'success' => true,

            'message' =>
                $uuDai->TrangThai === 'HoatDong'
                    ? 'Đã kích hoạt ưu đãi.'
                    : 'Đã ngừng áp dụng ưu đãi.',

            'data' => $uuDai,
        ]);
    }

    /**
     * Validation dùng chung cho tạo và cập nhật.
     *
     * Cả tạo và cập nhật:
     * - Ngày bắt đầu không được nằm trong quá khứ.
     * - Ngày kết thúc không được nằm trong quá khứ.
     * - Ngày kết thúc không được trước ngày bắt đầu.
     */
    private function validateData(Request $request): array {
        $data = $request->validate(
            [
                'TenUuDai' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'NhomUuDai' => [
                    'required',
                    Rule::in(self::NHOM),
                ],

                'GiaTriGiam' => [
                    'required',
                    'numeric',
                    'gt:0',
                ],

                /*
                 * Giá trị hóa đơn tối thiểu để áp dụng voucher.
                 * Dùng để hạn chế voucher được áp dụng cho hóa đơn quá nhỏ
                 * hoặc hạn chế các trường hợp dùng chung không hợp lý.
                 */
                'GiaTriHoaDonToiThieu' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'SoDiemCanDoi' => [
                    'required',
                    'integer',
                    'min:0',
                ],

                'SoLuongPhatHanh' => [
                    'required',
                    'integer',
                    'min:0',
                ],

                'NgayBatDau' => [
                    'required',
                    'date',
                    'after_or_equal:today',
                ],

                'NgayKetThuc' => [
                    'required',
                    'date',
                    'after_or_equal:NgayBatDau',
                    'after_or_equal:today',
                ],

                'MaHangThanhVien' => [
                    'nullable',
                    'exists:hangthanhvien,MaHangThanhVien',
                ],

                'CoTheDungChung' => [
                    'nullable',
                    'boolean',
                ],

                'ThuTuApDung' => [
                    'nullable',
                    'integer',
                    'min:1',
                ],

                'MoTa' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
            ],
            [
                'TenUuDai.required' =>
                    'Vui lòng nhập tên ưu đãi.',

                'NhomUuDai.required' =>
                    'Vui lòng chọn nhóm ưu đãi.',

                'NhomUuDai.in' =>
                    'Nhóm ưu đãi không hợp lệ.',

                'GiaTriGiam.required' =>
                    'Vui lòng nhập giá trị ưu đãi.',

                'GiaTriGiam.gt' =>
                    'Giá trị giảm hoặc quy đổi phải lớn hơn 0.',

                'GiaTriHoaDonToiThieu.min' =>
                    'Giá trị hóa đơn tối thiểu không được nhỏ hơn 0.',

                'SoDiemCanDoi.required' =>
                    'Vui lòng nhập số điểm cần đổi.',

                'SoLuongPhatHanh.required' =>
                    'Vui lòng nhập số lượng phát hành.',

                'NgayBatDau.required' =>
                    'Vui lòng chọn ngày bắt đầu.',

                'NgayBatDau.after_or_equal' =>
                    'Ngày bắt đầu không được nằm trong quá khứ.',

                'NgayKetThuc.required' =>
                    'Vui lòng chọn ngày kết thúc.',

                'NgayKetThuc.after_or_equal' =>
                    'Ngày kết thúc không được nằm trong quá khứ hoặc trước ngày bắt đầu.',

                'MaHangThanhVien.exists' =>
                    'Hạng thành viên được chọn không tồn tại.',
            ]
        );

        /*
         * Ưu đãi phần trăm chỉ chấp nhận giá trị từ trên 0 đến 100.
         */
        if (
            $data['NhomUuDai'] === 'PhanTram'
            && (float) $data['GiaTriGiam'] > 100
        ) {
            throw ValidationException::withMessages([
                'GiaTriGiam' => [
                    'Ưu đãi phần trăm không được vượt quá 100%.',
                ],
            ]);
        }

        /*
         * Ưu đãi tặng món hiện vẫn giữ GiaTriGiam theo cấu trúc
         * dữ liệu hiện tại. Không tự thay đổi API hoặc database.
         */
        $data['GiaTriHoaDonToiThieu'] =
            (float) ($data['GiaTriHoaDonToiThieu'] ?? 0);

        $data['CoTheDungChung'] =
            (int) ($data['CoTheDungChung'] ?? 0);

        $data['ThuTuApDung'] =
            (int) ($data['ThuTuApDung'] ?? 1);

        $data['MaHangThanhVien'] =
            !empty($data['MaHangThanhVien'])
                ? $data['MaHangThanhVien']
                : null;

        return $data;
    }

    /**
     * Gán dữ liệu dùng chung cho store và update.
     */
    private function fillUuDai(
        UuDai $uuDai,
        array $data
    ): void {
        $uuDai->TenUuDai =
            trim($data['TenUuDai']);

        $uuDai->SoDiemCanDoi =
            (int) $data['SoDiemCanDoi'];

        $uuDai->GiaTriGiam =
            $data['GiaTriGiam'];

        $uuDai->GiaTriHoaDonToiThieu =
            $data['GiaTriHoaDonToiThieu'];

        $uuDai->MoTa =
            $data['MoTa'] ?? null;

        $uuDai->SoLuongPhatHanh =
            (int) $data['SoLuongPhatHanh'];

        $uuDai->NgayBatDau =
            $data['NgayBatDau'];

        $uuDai->NgayKetThuc =
            $data['NgayKetThuc'];

        $uuDai->MaHangThanhVien =
            $data['MaHangThanhVien'];

        $uuDai->NhomUuDai =
            $data['NhomUuDai'];

        $uuDai->CoTheDungChung =
            $data['CoTheDungChung'];

        $uuDai->ThuTuApDung =
            $data['ThuTuApDung'];
    }

    /**
     * Chuẩn hóa dữ liệu request trước khi validation.
     */
    private function normalizeRequest(Request $request): void
    {
        $normalized = [];

        if ($request->has('TenUuDai')) {
            $normalized['TenUuDai'] = trim(
                (string) $request->input('TenUuDai')
            );
        }

        if ($request->has('MoTa')) {
            $moTa = trim(
                (string) $request->input('MoTa')
            );

            $normalized['MoTa'] =
                $moTa !== '' ? $moTa : null;
        }

        if ($request->has('MaHangThanhVien')) {
            $maHang = trim(
                (string) $request->input('MaHangThanhVien')
            );

            $normalized['MaHangThanhVien'] =
                $maHang !== '' ? $maHang : null;
        }

        /*
         * Các input number không bắt buộc thường được frontend gửi là "".
         * Chuyển về giá trị mặc định để tránh lỗi validation không cần thiết.
         */
        if (
            $request->has('GiaTriHoaDonToiThieu')
            && $request->input('GiaTriHoaDonToiThieu') === ''
        ) {
            $normalized['GiaTriHoaDonToiThieu'] = 0;
        }

        if (
            $request->has('ThuTuApDung')
            && $request->input('ThuTuApDung') === ''
        ) {
            $normalized['ThuTuApDung'] = 1;
        }

        if ($normalized !== []) {
            $request->merge($normalized);
        }
    }
}
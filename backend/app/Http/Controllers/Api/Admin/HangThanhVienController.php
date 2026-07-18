<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HangThanhVien;
use App\Services\SequentialCodeService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HangThanhVienController extends Controller
{
    public function __construct(
        private SequentialCodeService $codes
    ) {
    }

    /**
     * Lấy danh sách quy tắc tích điểm có thể gắn cho hạng thành viên.
     *
     * Mỗi quy tắc chỉ được gắn với một hạng. Khi chỉnh sửa một hạng,
     * quy tắc đang được chính hạng đó sử dụng vẫn được trả về.
     *
     * Route này phải được khai báo trước:
     * /hang-thanh-vien/{ma}
     */
    public function tuyChon(Request $request)
    {
        $maHangHienTai = trim(
            (string) $request->query('ma_hang', '')
        );

        $maHangHienTai = $maHangHienTai !== ''
            ? $maHangHienTai
            : null;

        $quyTacDaSuDung = DB::table('hangthanhvien')
            ->whereNotNull('MaQuyTac')
            ->when(
                $maHangHienTai,
                fn ($query) => $query->where(
                    'MaHangThanhVien',
                    '!=',
                    $maHangHienTai
                )
            )
            ->pluck('MaQuyTac')
            ->filter()
            ->values()
            ->all();

        $quyTac = DB::table('quytactichdiem')
            ->select([
                'MaQuyTac',
                'SoTienQuyDoi',
                'SoDiemNhan',
                'TrangThai',
            ])
            ->when(
                count($quyTacDaSuDung) > 0,
                fn ($query) => $query->whereNotIn(
                    'MaQuyTac',
                    $quyTacDaSuDung
                )
            )
            ->orderBy('MaQuyTac')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'quyTac' => $quyTac,
            ],
        ]);
    }

    /**
     * Danh sách hạng thành viên, hỗ trợ tìm kiếm và phân trang.
     */
    public function index(Request $request)
    {
        $query = HangThanhVien::query();

        $keyword = trim(
            (string) $request->query('search', '')
        );

        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery
                    ->where('TenHang', 'like', "%{$keyword}%")
                    ->orWhere(
                        'MaHangThanhVien',
                        'like',
                        "%{$keyword}%"
                    );
            });
        }

        $query
            ->orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->orderBy('MaHangThanhVien');

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
     * Xem chi tiết một hạng thành viên.
     */
    public function show(string $ma)
    {
        $hangThanhVien = HangThanhVien::find($ma);

        if (!$hangThanhVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hạng thành viên.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $hangThanhVien,
        ]);
    }

    /**
     * Tạo hạng thành viên mới.
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $hangThanhVien = DB::transaction(
            function () use ($data) {
                /*
                 * Khóa danh sách hạng để hạn chế hai request đồng thời:
                 * - dùng cùng một quy tắc;
                 * - tạo cùng vị trí hạng;
                 * - tạo ngưỡng điểm hoặc chi tiêu không nhất quán.
                 */
                HangThanhVien::query()
                    ->orderBy('ThuTuHang')
                    ->lockForUpdate()
                    ->get();

                $this->assertQuyTacChuaDuocSuDung(
                    $data['MaQuyTac']
                );

                $this->assertLogicalThresholds($data);

                $hangThanhVien = new HangThanhVien();

                $hangThanhVien->MaHangThanhVien =
                    $this->codes->next(
                        'hangthanhvien',
                        'MaHangThanhVien',
                        'HTV'
                    );

                $this->fillHangThanhVien(
                    $hangThanhVien,
                    $data
                );

                $hangThanhVien->save();

                return $hangThanhVien;
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm hạng thành viên thành công.',
            'data' => $hangThanhVien,
        ], 201);
    }

    /**
     * Cập nhật hạng thành viên.
     */
    public function update(
        Request $request,
        string $ma
    ) {
        $data = $this->validateData($request, $ma);

        $hangThanhVien = DB::transaction(
            function () use ($data, $ma) {
                /*
                 * Khóa toàn bộ danh sách để các kiểm tra về thứ tự,
                 * ngưỡng và quy tắc được thực hiện trên cùng một trạng thái.
                 */
                HangThanhVien::query()
                    ->orderBy('ThuTuHang')
                    ->lockForUpdate()
                    ->get();

                $hangThanhVien = HangThanhVien::query()
                    ->where('MaHangThanhVien', $ma)
                    ->lockForUpdate()
                    ->first();

                if (!$hangThanhVien) {
                    return null;
                }

                $this->assertQuyTacChuaDuocSuDung(
                    $data['MaQuyTac'],
                    $ma
                );

                $this->assertLogicalThresholds(
                    $data,
                    $ma
                );

                $this->fillHangThanhVien(
                    $hangThanhVien,
                    $data
                );

                $hangThanhVien->save();

                return $hangThanhVien;
            }
        );

        if (!$hangThanhVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hạng thành viên.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hạng thành viên thành công.',
            'data' => $hangThanhVien,
        ]);
    }

    /**
     * Xóa hạng thành viên.
     *
     * Chỉ cho phép xóa khi:
     * - hệ thống vẫn còn ít nhất một hạng;
     * - đây không phải hạng mặc định thấp nhất;
     * - không có khách hàng đang thuộc hạng;
     * - không có ưu đãi đang tham chiếu đến hạng.
     */
    public function destroy(string $ma)
    {
        $hangThanhVien = HangThanhVien::find($ma);

        if (!$hangThanhVien) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hạng thành viên.',
            ], 404);
        }

        if (HangThanhVien::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Hệ thống phải luôn có ít nhất một hạng thành viên.',
            ], 409);
        }

        $maHangThapNhat = HangThanhVien::query()
            ->orderBy('ThuTuHang')
            ->orderBy('DiemToiThieu')
            ->value('MaHangThanhVien');

        if ($maHangThapNhat === $ma) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể xóa hạng mặc định thấp nhất của hệ thống.',
            ], 409);
        }

        $coKhachHang = DB::table('khachhang')
            ->where('MaHangThanhVien', $ma)
            ->exists();

        if ($coKhachHang) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể xóa vì đang có khách hàng thuộc hạng này.',
            ], 409);
        }

        /*
         * uudai.MaHangThanhVien có thể không có khóa ngoại tại database.
         * Cần kiểm tra thủ công để không tạo dữ liệu ưu đãi mồ côi.
         */
        $coUuDai = DB::table('uudai')
            ->where('MaHangThanhVien', $ma)
            ->exists();

        if ($coUuDai) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể xóa vì đang có ưu đãi được gán cho hạng này.',
            ], 409);
        }

        try {
            $hangThanhVien->delete();
        } catch (QueryException $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' =>
                    'Không thể xóa vì hạng đang được dữ liệu khác sử dụng.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa hạng thành viên.',
        ]);
    }

    /**
     * Kiểm tra dữ liệu đầu vào.
     */
    private function validateData(
        Request $request,
        ?string $ignoreId = null
    ): array {
        $validated = $request->validate(
            [
                'TenHang' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique(
                        'hangthanhvien',
                        'TenHang'
                    )->ignore(
                        $ignoreId,
                        'MaHangThanhVien'
                    ),
                ],

                'MoTa' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'TongChiTieuToiThieu' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'DiemToiThieu' => [
                    'required',
                    'integer',
                    'min:0',
                ],

                'ThuTuHang' => [
                    'required',
                    'integer',
                    'min:1',
                    Rule::unique(
                        'hangthanhvien',
                        'ThuTuHang'
                    )->ignore(
                        $ignoreId,
                        'MaHangThanhVien'
                    ),
                ],

                'MaQuyTac' => [
                    'required',
                    'string',
                    'exists:quytactichdiem,MaQuyTac',

                    /*
                     * Mỗi quy tắc tích điểm chỉ được gắn cho một hạng.
                     * Khi cập nhật, bỏ qua chính hạng đang sửa.
                     */
                    Rule::unique(
                        'hangthanhvien',
                        'MaQuyTac'
                    )->ignore(
                        $ignoreId,
                        'MaHangThanhVien'
                    ),
                ],
            ],
            [
                'TenHang.unique' =>
                    'Tên hạng thành viên đã được sử dụng.',

                'ThuTuHang.unique' =>
                    'Thứ tự hạng đã được sử dụng.',

                'MaQuyTac.exists' =>
                    'Quy tắc tích điểm không tồn tại.',

                'MaQuyTac.unique' =>
                    'Quy tắc tích điểm này đã được gán cho một hạng khác.',
            ]
        );

        $validated['TenHang'] = trim(
            (string) $validated['TenHang']
        );

        if (array_key_exists('MoTa', $validated)) {
            $moTa = trim(
                (string) ($validated['MoTa'] ?? '')
            );

            $validated['MoTa'] =
                $moTa !== '' ? $moTa : null;
        }

        return $validated;
    }

    /**
     * Kiểm tra lại trong transaction để tránh trường hợp hai request
     * cùng vượt qua validation trước khi một trong hai request lưu dữ liệu.
     */
    private function assertQuyTacChuaDuocSuDung(
        string $maQuyTac,
        ?string $boQuaMaHang = null
    ): void {
        $daDuocSuDung = HangThanhVien::query()
            ->where('MaQuyTac', $maQuyTac)
            ->when(
                $boQuaMaHang,
                fn ($query) => $query->where(
                    'MaHangThanhVien',
                    '!=',
                    $boQuaMaHang
                )
            )
            ->exists();

        if ($daDuocSuDung) {
            throw ValidationException::withMessages([
                'MaQuyTac' => [
                    'Quy tắc tích điểm này đã được gán cho một hạng khác.',
                ],
            ]);
        }
    }

    /**
     * Kiểm tra thứ tự và các ngưỡng của hạng.
     *
     * Quy tắc:
     * - Hạng thấp nhất phải bắt đầu từ 0 điểm và 0 đồng chi tiêu.
     * - Điểm tối thiểu phải tăng dần theo thứ tự hạng.
     * - Tổng chi tiêu tối thiểu phải tăng dần theo thứ tự hạng.
     */
    private function assertLogicalThresholds(
        array $data,
        ?string $ignoreId = null
    ): void {
        $baseQuery = HangThanhVien::query()
            ->when(
                $ignoreId,
                fn ($query) => $query->where(
                    'MaHangThanhVien',
                    '!=',
                    $ignoreId
                )
            );

        $previous = (clone $baseQuery)
            ->where(
                'ThuTuHang',
                '<',
                (int) $data['ThuTuHang']
            )
            ->orderByDesc('ThuTuHang')
            ->first();

        $next = (clone $baseQuery)
            ->where(
                'ThuTuHang',
                '>',
                (int) $data['ThuTuHang']
            )
            ->orderBy('ThuTuHang')
            ->first();

        $errors = [];

        if (
            !$previous
            && (
                (int) $data['DiemToiThieu'] !== 0
                || (float) $data['TongChiTieuToiThieu'] !== 0.0
            )
        ) {
            $errors['DiemToiThieu'][] =
                'Hạng thấp nhất phải bắt đầu từ 0 điểm.';

            $errors['TongChiTieuToiThieu'][] =
                'Hạng thấp nhất phải bắt đầu từ 0 đồng chi tiêu.';
        }

        if (
            $previous
            && (int) $data['DiemToiThieu']
                <= (int) $previous->DiemToiThieu
        ) {
            $errors['DiemToiThieu'][] =
                "Điểm tối thiểu phải lớn hơn hạng đứng trước \"{$previous->TenHang}\".";
        }

        if (
            $next
            && (int) $data['DiemToiThieu']
                >= (int) $next->DiemToiThieu
        ) {
            $errors['DiemToiThieu'][] =
                "Điểm tối thiểu phải nhỏ hơn hạng đứng sau \"{$next->TenHang}\".";
        }

        if (
            $previous
            && (float) $data['TongChiTieuToiThieu']
                <= (float) $previous->TongChiTieuToiThieu
        ) {
            $errors['TongChiTieuToiThieu'][] =
                "Chi tiêu tối thiểu phải lớn hơn hạng đứng trước \"{$previous->TenHang}\".";
        }

        if (
            $next
            && (float) $data['TongChiTieuToiThieu']
                >= (float) $next->TongChiTieuToiThieu
        ) {
            $errors['TongChiTieuToiThieu'][] =
                "Chi tiêu tối thiểu phải nhỏ hơn hạng đứng sau \"{$next->TenHang}\".";
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(
                $errors
            );
        }
    }

    /**
     * Gán dữ liệu dùng chung cho store và update.
     */
    private function fillHangThanhVien(
        HangThanhVien $hangThanhVien,
        array $data
    ): void {
        $hangThanhVien->TenHang =
            trim($data['TenHang']);

        $hangThanhVien->MoTa =
            $data['MoTa'] ?? null;

        $hangThanhVien->TongChiTieuToiThieu =
            $data['TongChiTieuToiThieu'];

        $hangThanhVien->DiemToiThieu =
            $data['DiemToiThieu'];

        $hangThanhVien->ThuTuHang =
            $data['ThuTuHang'];

        $hangThanhVien->MaQuyTac =
            $data['MaQuyTac'];
    }
}
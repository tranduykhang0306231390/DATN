<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LichSuGiaoDichDiem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberHistoryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'keyword' => ['nullable', 'string', 'max:100'],
            'type' => [
                'nullable',
                Rule::in(['all', 'CongDiemHoaDon', 'DoiVoucher', 'HoanDiemHuyHD']),
            ],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'sort' => ['nullable', 'in:newest,oldest,point_desc,point_asc'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        if (
            !empty($validated['from'])
            && !empty($validated['to'])
            && $validated['to'] < $validated['from']
        ) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'to' => ['Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.'],
            ]);
        }

        $user = auth('khachhang')->user();

        $query = LichSuGiaoDichDiem::where(
            'MaKhachHang',
            $user->MaKhachHang
        );

        /*
        |--------------------------------------------------------------------------
        | Tìm kiếm
        |--------------------------------------------------------------------------
        */

        if (!empty($validated['keyword'])) {

            $keyword = trim($validated['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where(
                    'MaGiaoDichDiem',
                    'like',
                    "%{$keyword}%"
                )->orWhere(
                    'MaThamChieu',
                    'like',
                    "%{$keyword}%"
                );
            });

        }

        /*
        |--------------------------------------------------------------------------
        | Lọc loại giao dịch
        |--------------------------------------------------------------------------
        */

        if (
            !empty($validated['type'])
            &&
            $validated['type'] !== 'all'
        ) {

            $query->where(
                'LoaiGiaoDich',
                $validated['type']
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Lọc khoảng thời gian
        |--------------------------------------------------------------------------
        */

        if (!empty($validated['from'])) {

            $query->whereDate(
                'ThoiGianGiaoDich',
                '>=',
                $validated['from']
            );

        }

        if (!empty($validated['to'])) {

            $query->whereDate(
                'ThoiGianGiaoDich',
                '<=',
                $validated['to']
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Sắp xếp
        |--------------------------------------------------------------------------
        */

        switch ($validated['sort'] ?? 'newest') {

            case 'oldest':

                $query->orderBy(
                    'ThoiGianGiaoDich',
                    'asc'
                )->orderByRaw(
                    'CAST(SUBSTRING(MaGiaoDichDiem, 4) AS UNSIGNED) ASC'
                );

                break;

            case 'point_desc':

                $query->orderBy(
                    'SoDiem',
                    'desc'
                )->orderBy('ThoiGianGiaoDich', 'desc')
                    ->orderByRaw(
                        'CAST(SUBSTRING(MaGiaoDichDiem, 4) AS UNSIGNED) DESC'
                    );

                break;

            case 'point_asc':

                $query->orderBy(
                    'SoDiem',
                    'asc'
                )->orderBy('ThoiGianGiaoDich', 'desc')
                    ->orderByRaw(
                        'CAST(SUBSTRING(MaGiaoDichDiem, 4) AS UNSIGNED) DESC'
                    );

                break;

            default:

                // Mã có dạng GDD123: sắp xếp theo phần số để GDD1000
                // luôn mới hơn GDD999, kể cả trước khi phân trang.
                // Mã không đúng định dạng được đưa xuống sau và có tiêu chí phụ
                // ổn định, tránh phụ thuộc vào thứ tự vật lý của database.
                $query->orderByRaw(
                    "CASE WHEN MaGiaoDichDiem REGEXP '^GDD[0-9]+$' THEN 0 ELSE 1 END ASC"
                )->orderByRaw(
                    "CASE WHEN MaGiaoDichDiem REGEXP '^GDD[0-9]+$' "
                    . 'THEN CAST(SUBSTRING(MaGiaoDichDiem, 4) AS UNSIGNED) ELSE 0 END DESC'
                )->orderBy('ThoiGianGiaoDich', 'desc')
                    ->orderBy('MaGiaoDichDiem', 'desc');

                break;

        }

        $history = $query
            ->paginate(10)
            ->appends($request->query());

        return response()->json($history);
    }
}

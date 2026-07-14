<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LichSuGiaoDichDiem;
use Illuminate\Http\Request;

class MemberHistoryController extends Controller
{
    public function index(Request $request)
    {
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

        if ($request->filled('keyword')) {

            $keyword = trim($request->keyword);

            $query->where(function ($q) use ($keyword) {

                $q->where(
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
            $request->filled('type')
            &&
            $request->type !== 'all'
        ) {

            $query->where(
                'LoaiGiaoDich',
                $request->type
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Lọc khoảng thời gian
        |--------------------------------------------------------------------------
        */

        if ($request->filled('from')) {

            $query->whereDate(
                'ThoiGianGiaoDich',
                '>=',
                $request->from
            );

        }

        if ($request->filled('to')) {

            $query->whereDate(
                'ThoiGianGiaoDich',
                '<=',
                $request->to
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Sắp xếp
        |--------------------------------------------------------------------------
        */

        switch ($request->sort) {

            case 'oldest':

                $query->orderBy(
                    'ThoiGianGiaoDich',
                    'asc'
                );

                break;

            case 'point_desc':

                $query->orderBy(
                    'SoDiem',
                    'desc'
                );

                break;

            case 'point_asc':

                $query->orderBy(
                    'SoDiem',
                    'asc'
                );

                break;

            default:

                $query->orderBy(
                    'ThoiGianGiaoDich',
                    'desc'
                );

                break;

        }

        $history = $query
            ->paginate(10)
            ->appends($request->query());

        return response()->json($history);
    }
}
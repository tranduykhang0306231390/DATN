<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CauHinhDatBan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CauHinhDatBanController extends Controller
{
    /**
     * Lấy cấu hình đặt bàn.
     *
     * Không tự tạo bản ghi database khi nhận request GET — trả về giá trị
     * mặc định (khớp default của migration) nếu chưa có bản ghi nào.
     */
    public function show()
    {
        $cauHinh = CauHinhDatBan::query()->first();

        if (!$cauHinh) {
            $cauHinh = new CauHinhDatBan([
                'ThoiGianGiuChoPhut' => 10,
                'SoGioDatToiThieu' => 2,
                'SoKhachToiThieu' => 2,
                'SoKhachToiDa' => 20,
                'PhutGiuBanSauGioHen' => 15,
                'MucCocMoiKhach' => 50000,
                'SoGioHuyMienPhi' => 6,
                'SoGioHuyMotPhan' => 2,
                'PhanTramHoanMotPhan' => 50,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $cauHinh,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(
            [
                'ThoiGianGiuChoPhut' => ['required', 'integer', 'min:1', 'max:120'],
                'SoGioDatToiThieu' => ['required', 'integer', 'min:0', 'max:168'],
                'SoKhachToiThieu' => ['required', 'integer', 'min:1', 'max:100'],
                'SoKhachToiDa' => ['required', 'integer', 'min:1', 'max:200'],
                'PhutGiuBanSauGioHen' => ['required', 'integer', 'min:1', 'max:180'],
                'MucCocMoiKhach' => ['required', 'numeric', 'min:0'],
                'SoGioHuyMienPhi' => ['required', 'integer', 'min:0', 'max:168'],
                'SoGioHuyMotPhan' => ['required', 'integer', 'min:0', 'max:168'],
                'PhanTramHoanMotPhan' => ['required', 'integer', 'min:0', 'max:100'],
            ],
            [
                'SoKhachToiDa.min' => 'Số khách tối đa phải lớn hơn 0.',
            ]
        );

        if ($data['SoKhachToiDa'] < $data['SoKhachToiThieu']) {
            return response()->json([
                'success' => false,
                'message' => 'Số khách tối đa phải lớn hơn hoặc bằng số khách tối thiểu.',
            ], 422);
        }

        if ($data['SoGioHuyMotPhan'] > $data['SoGioHuyMienPhi']) {
            return response()->json([
                'success' => false,
                'message' => 'Mốc hủy hoàn một phần phải nhỏ hơn hoặc bằng mốc hủy miễn phí.',
            ], 422);
        }

        $cauHinh = DB::transaction(function () use ($data) {
            /*
             * Khóa bản ghi cấu hình hiện tại để tránh hai Admin
             * cập nhật đồng thời và ghi đè dữ liệu của nhau.
             */
            $cauHinh = CauHinhDatBan::query()
                ->lockForUpdate()
                ->first();

            if (!$cauHinh) {
                $cauHinh = new CauHinhDatBan();
            }

            $cauHinh->fill($data);
            $cauHinh->save();

            return $cauHinh;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình đặt bàn thành công.',
            'data' => $cauHinh,
        ]);
    }
}

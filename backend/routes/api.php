<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoaDonController;
use App\Http\Controllers\Api\HoaDonKhachHangController;
use App\Http\Controllers\Api\LoaiVeController;
use App\Http\Controllers\Api\MemberHistoryController;
use App\Http\Controllers\Api\MemberPointController;
use App\Http\Controllers\Api\MemberRankController;
use App\Http\Controllers\Api\MemberRankHistoryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PhanHoiKhachHangController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TraCuuKhachHangController;
use App\Http\Controllers\Api\VoucherController;

use App\Http\Controllers\Api\Admin\HangThanhVienController;
use App\Http\Controllers\Api\Admin\KhachHangController;
use App\Http\Controllers\Api\Admin\NhanVienController;
use App\Http\Controllers\Api\Admin\PhanHoiController;
use App\Http\Controllers\Api\Admin\QuyTacController;
use App\Http\Controllers\Api\Admin\ThongBaoController;
use App\Http\Controllers\Api\Admin\ThongKeController;
use App\Http\Controllers\Api\Admin\UuDaiController;
use App\Http\Controllers\Api\Admin\WebSettingController;

/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
*/

Route::post('/member/login', [AuthController::class, 'memberLogin'])
    ->middleware('throttle:10,1');

Route::post('/member/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/member/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:5,1');

Route::post('/member/reset-password', [AuthController::class, 'resetPassword'])
    ->middleware('throttle:5,1');

Route::post('/staff/login', [AuthController::class, 'staffLogin'])
    ->middleware('throttle:10,1');

Route::post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| Public website data
|--------------------------------------------------------------------------
*/

Route::get('/tickets', [TicketController::class, 'index']);
Route::get('/tickets/hot', [TicketController::class, 'hot']);

Route::get('/web-setting', [WebSettingController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Member API
|--------------------------------------------------------------------------
*/

Route::middleware('member')
    ->prefix('member')
    ->group(function () {
        /*
        |--------------------------------------------------------------------------
        | Thông tin khách hàng
        |--------------------------------------------------------------------------
        */

        Route::get('/profile', [AuthController::class, 'memberProfile']);
        Route::put('/profile', [AuthController::class, 'updateMemberProfile']);

        Route::put('/change-password', [
            AuthController::class,
            'changePassword',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Điểm và hạng thành viên
        |--------------------------------------------------------------------------
        */

        Route::get('/points', [MemberPointController::class, 'index']);
        Route::get('/ranks', [MemberRankController::class, 'index']);
        Route::get('/history', [MemberHistoryController::class, 'index']);

        Route::get('/rank-history', [
            MemberRankHistoryController::class,
            'index',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Vé
        |--------------------------------------------------------------------------
        */

        Route::get('/tickets', [TicketController::class, 'index']);
        Route::get('/tickets/hot', [TicketController::class, 'hot']);

        /*
        |--------------------------------------------------------------------------
        | Voucher
        |--------------------------------------------------------------------------
        */

        Route::get('/my-vouchers', [
            VoucherController::class,
            'myVoucher',
        ]);

        Route::get('/voucher-store', [
            VoucherController::class,
            'voucherStore',
        ]);

        Route::get('/voucher-hot', [
            VoucherController::class,
            'hot',
        ]);

        Route::post('/exchange-voucher', [
            VoucherController::class,
            'exchangeVoucher',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Hóa đơn khách hàng
        |--------------------------------------------------------------------------
        */

        Route::get('/invoices', [
            HoaDonKhachHangController::class,
            'index',
        ]);

        Route::get('/invoices/{id}', [
            HoaDonKhachHangController::class,
            'show',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Phản hồi hóa đơn
        |--------------------------------------------------------------------------
        */

        Route::post('/invoices/{id}/feedback', [
            PhanHoiKhachHangController::class,
            'store',
        ]);

        Route::get('/invoices/{id}/feedback', [
            PhanHoiKhachHangController::class,
            'show',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Thông báo
        |--------------------------------------------------------------------------
        */

        Route::get('/notifications', [
            NotificationController::class,
            'index',
        ]);

        Route::get('/notifications/unread-count', [
            NotificationController::class,
            'unreadCount',
        ]);

        Route::patch('/notifications/read-all', [
            NotificationController::class,
            'readAll',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Staff API
|--------------------------------------------------------------------------
*/

Route::middleware('staff')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Hồ sơ nhân viên
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [
        AuthController::class,
        'staffProfile',
    ]);

    Route::put('/profile', [
        AuthController::class,
        'updateStaffProfile',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Loại vé
    |--------------------------------------------------------------------------
    */

    Route::get('/loai-ve', [
        LoaiVeController::class,
        'index',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Tra cứu khách hàng
    |--------------------------------------------------------------------------
    */

    Route::post('/khach-hang/lookup', [
        TraCuuKhachHangController::class,
        'lookup',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Quy trình hóa đơn và phục vụ bàn
    |--------------------------------------------------------------------------
    */

    // Mở bàn và tạo hóa đơn ban đầu.
    Route::post('/hoa-don', [
        HoaDonController::class,
        'store',
    ]);

    // Lấy thông tin một hóa đơn theo mã.
    Route::get('/hoa-don/{maHoaDon}', [
        HoaDonController::class,
        'show',
    ]);

    // Gọi thêm món cho bàn đang phục vụ.
    Route::post('/hoa-don/{maHD}/them-mon', [
        HoaDonController::class,
        'themMon',
    ]);

    // Đổi bàn.
    Route::patch('/hoa-don/{maHD}/doi-ban', [
        HoaDonController::class,
        'doiBan',
    ]);

    // Hủy bàn đang phục vụ.
    Route::patch('/hoa-don/{maHD}/huy-ban', [
        HoaDonController::class,
        'huyBan',
    ]);

    // Ước tính tổng tiền, voucher và điểm trước khi thanh toán.
    Route::post('/hoa-don/{maHD}/uoc-tinh', [
        HoaDonController::class,
        'uocTinh',
    ]);

    // Hoàn tất thanh toán, áp dụng voucher và tích điểm ở bước cuối.
    Route::patch('/hoa-don/{maHD}/thanh-toan', [
        HoaDonController::class,
        'thanhToan',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Quản lý hóa đơn
    |--------------------------------------------------------------------------
    */

    Route::get('/quan-ly-hoa-don', [
        HoaDonController::class,
        'index',
    ]);

    Route::get('/quan-ly-hoa-don/ban-dang-treo', [
        HoaDonController::class,
        'banDangTreo',
    ]);

    Route::get('/quan-ly-hoa-don/{maHD}', [
        HoaDonController::class,
        'show',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Admin API
    |--------------------------------------------------------------------------
    */

    Route::middleware('staff:Admin')
        ->prefix('admin')
        ->group(function () {
            /*
            |--------------------------------------------------------------------------
            | Quản lý ưu đãi
            |--------------------------------------------------------------------------
            */

            Route::get('/uu-dai/tuy-chon', [
                UuDaiController::class,
                'tuyChon',
            ]);

            Route::get('/uu-dai', [
                UuDaiController::class,
                'index',
            ]);

            Route::get('/uu-dai/{ma}', [
                UuDaiController::class,
                'show',
            ]);

            Route::post('/uu-dai', [
                UuDaiController::class,
                'store',
            ]);

            Route::put('/uu-dai/{ma}', [
                UuDaiController::class,
                'update',
            ]);

            Route::patch('/uu-dai/{ma}/trang-thai', [
                UuDaiController::class,
                'toggleTrangThai',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý loại vé
            |--------------------------------------------------------------------------
            */

            Route::get('/loai-ve', [
                LoaiVeController::class,
                'adminIndex',
            ]);

            Route::post('/loai-ve', [
                LoaiVeController::class,
                'store',
            ]);

            Route::put('/loai-ve/{ma}', [
                LoaiVeController::class,
                'update',
            ]);

            Route::patch('/loai-ve/{ma}/trang-thai', [
                LoaiVeController::class,
                'toggleTrangThai',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý quy tắc tích điểm
            |--------------------------------------------------------------------------
            */

            Route::get('/quy-tac', [
                QuyTacController::class,
                'index',
            ]);

            Route::get('/quy-tac/{ma}', [
                QuyTacController::class,
                'show',
            ]);

            Route::post('/quy-tac', [
                QuyTacController::class,
                'store',
            ]);

            Route::put('/quy-tac/{ma}', [
                QuyTacController::class,
                'update',
            ]);

            Route::patch('/quy-tac/{ma}/trang-thai', [
                QuyTacController::class,
                'toggleTrangThai',
            ]);

            Route::get('/lich-su-quy-tac', [
                QuyTacController::class,
                'lichSu',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý hạng thành viên
            |--------------------------------------------------------------------------
            */

            Route::get('/hang-thanh-vien/tuy-chon', [
                HangThanhVienController::class,
                'tuyChon',
            ]);

            Route::get('/hang-thanh-vien', [
                HangThanhVienController::class,
                'index',
            ]);

            Route::get('/hang-thanh-vien/{ma}', [
                HangThanhVienController::class,
                'show',
            ]);

            Route::post('/hang-thanh-vien', [
                HangThanhVienController::class,
                'store',
            ]);

            Route::put('/hang-thanh-vien/{ma}', [
                HangThanhVienController::class,
                'update',
            ]);

            Route::delete('/hang-thanh-vien/{ma}', [
                HangThanhVienController::class,
                'destroy',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý nhân viên
            |--------------------------------------------------------------------------
            */

            Route::get('/nhan-vien', [
                NhanVienController::class,
                'index',
            ]);

            Route::get('/nhan-vien/{ma}', [
                NhanVienController::class,
                'show',
            ]);

            Route::post('/nhan-vien', [
                NhanVienController::class,
                'store',
            ]);

            Route::put('/nhan-vien/{ma}', [
                NhanVienController::class,
                'update',
            ]);

            Route::patch('/nhan-vien/{ma}/trang-thai', [
                NhanVienController::class,
                'toggleTrangThai',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý khách hàng
            |--------------------------------------------------------------------------
            */

            Route::get('/khach-hang/tuy-chon', [
                KhachHangController::class,
                'tuyChon',
            ]);

            Route::get('/khach-hang', [
                KhachHangController::class,
                'index',
            ]);

            Route::get('/khach-hang/{ma}', [
                KhachHangController::class,
                'show',
            ]);

            Route::put('/khach-hang/{ma}', [
                KhachHangController::class,
                'update',
            ]);

            Route::patch('/khach-hang/{ma}/trang-thai', [
                KhachHangController::class,
                'toggleTrangThai',
            ]);

            Route::get('/lich-su-hang', [
                KhachHangController::class,
                'lichSuHang',
            ]);

            Route::get('/lich-su-diem', [
                KhachHangController::class,
                'lichSuDiem',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý thông báo
            |--------------------------------------------------------------------------
            */

            Route::get('/thong-bao/tuy-chon', [
                ThongBaoController::class,
                'tuyChon',
            ]);

            Route::get('/thong-bao', [
                ThongBaoController::class,
                'index',
            ]);

            Route::post('/thong-bao', [
                ThongBaoController::class,
                'store',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Quản lý phản hồi
            |--------------------------------------------------------------------------
            */

            Route::get('/phan-hoi', [
                PhanHoiController::class,
                'index',
            ]);

            Route::get('/phan-hoi/{ma}', [
                PhanHoiController::class,
                'show',
            ]);

            Route::patch('/phan-hoi/{ma}/tra-loi', [
                PhanHoiController::class,
                'traLoi',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Thống kê
            |--------------------------------------------------------------------------
            */

            Route::get('/thong-ke/tong-quan', [
                ThongKeController::class,
                'tongQuan',
            ]);

            Route::get('/thong-ke/chi-tiet', [
                ThongKeController::class,
                'chiTiet',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Hủy hóa đơn đã thanh toán
            |--------------------------------------------------------------------------
            */

            Route::patch('/hoa-don/{maHD}/huy', [
                HoaDonController::class,
                'huyHoaDonDaThanhToan',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Cấu hình website
            |--------------------------------------------------------------------------
            */

            Route::get('/web-setting', [
                WebSettingController::class,
                'show',
            ]);

            Route::put('/web-setting', [
                WebSettingController::class,
                'update',
            ]);
        });
});
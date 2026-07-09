<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberPointController;
use App\Http\Controllers\Api\MemberHistoryController;
use App\Http\Controllers\Api\HoaDonController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\MemberVoucherController;
use App\Http\Controllers\Api\HoaDonKhachHangController;
use App\Http\Controllers\Api\LoaiVeController;
use App\Http\Controllers\Api\TraCuuKhachHangController;
use App\Http\Controllers\Api\QuanLyHoaDonController;
use App\Http\Controllers\Api\PhanHoiKhachHangController;
use App\Http\Controllers\Api\Admin\UuDaiController;
use App\Http\Controllers\Api\Admin\QuyTacController;
use App\Http\Controllers\Api\Admin\HangThanhVienController;
use App\Http\Controllers\Api\Admin\NhanVienController;
use App\Http\Controllers\Api\Admin\KhachHangController;
use App\Http\Controllers\Api\Admin\ThongBaoController;
use App\Http\Controllers\Api\Admin\PhanHoiController;
use App\Http\Controllers\Api\Admin\ThongKeController;
use App\Http\Controllers\Api\Admin\WebSettingController;


use App\Http\Controllers\Api\MemberRankHistoryController;


use App\Http\Controllers\Api\NotificationController;


/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
*/

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/member/register', [AuthController::class, 'register']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/banner', [BannerController::class, 'index']);
Route::get('/tickets', [TicketController::class, 'index']);
Route::get('/tickets/hot', [TicketController::class, 'hot']);

/*
|--------------------------------------------------------------------------
| MEMBER
|--------------------------------------------------------------------------
*/

Route::middleware('member')->prefix('member')->group(function () {

    // ===== Thông tin khách hàng =====
    Route::get('/profile', [AuthController::class, 'memberProfile']);
    Route::get('/points', [MemberPointController::class, 'index']);
    Route::get('/history', [MemberHistoryController::class, 'index']);
    Route::put('/profile', [AuthController::class, 'updateMemberProfile']);
    // ===== Vé đã mua =====
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/hot', [TicketController::class, 'hot']);


    // ===== Voucher =====

    // Voucher của khách
    Route::get('/my-vouchers', [VoucherController::class, 'myVoucher']);

    // Kho voucher
    Route::get('/voucher-store', [VoucherController::class, 'voucherStore']);

    // Voucher nổi bật Home
    Route::get('/voucher-hot', [VoucherController::class, 'hot']);

    // Đổi voucher
    Route::post('/exchange-voucher', [VoucherController::class, 'exchangeVoucher']);

    // ===== Hóa đơn =====
    Route::get('/invoices', [HoaDonKhachHangController::class, 'index']);
    Route::get('/invoices/{id}', [HoaDonKhachHangController::class, 'show']);
    // ====== Phản hồi =====
    Route::post('/invoices/{id}/feedback', [PhanHoiKhachHangController::class, 'store']);
    Route::get('/invoices/{id}/feedback', [PhanHoiKhachHangController::class, 'show']);
    Route::get(
        '/rank-history',
        [MemberRankHistoryController::class, 'index']

    );
    // thông báo 
    Route::get('/notifications', [NotificationController::class, 'index']);

    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    Route::patch('/notifications/read-all', [NotificationController::class, 'readAll']);

});

/*
|--------------------------------------------------------------------------
| STAFF
|--------------------------------------------------------------------------
*/



// Các API nhân viên khác...

Route::middleware('auth:nhanvien')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'staffProfile']);

    // Loại vé
    Route::get('/loai-ve', [LoaiVeController::class, 'index']);

    // Tra cứu khách hàng
    Route::post('/khach-hang/lookup', [TraCuuKhachHangController::class, 'lookup']);

    // Hóa đơn
    Route::post('/hoa-don', [HoaDonController::class, 'store']);
    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'show']);

    Route::get('/quan-ly-hoa-don', [QuanLyHoaDonController::class, 'index']);
    Route::get('/quan-ly-hoa-don/{maHD}', [QuanLyHoaDonController::class, 'show']);
    Route::patch('/quan-ly-hoa-don/{maHD}/huy', [QuanLyHoaDonController::class, 'huy']);


    Route::middleware('staff:Admin')->prefix('admin')->group(function () {
        Route::get('/uu-dai/tuy-chon',              [UuDaiController::class, 'tuyChon']);
        Route::get('/uu-dai',                       [UuDaiController::class, 'index']);
        Route::get('/uu-dai/{ma}',                  [UuDaiController::class, 'show']);
        Route::post('/uu-dai',                      [UuDaiController::class, 'store']);
        Route::put('/uu-dai/{ma}',                  [UuDaiController::class, 'update']);
        Route::patch('/uu-dai/{ma}/trang-thai',     [UuDaiController::class, 'toggleTrangThai']);


        Route::get('/loai-ve',                      [LoaiVeController::class, 'adminIndex']);
        Route::post('/loai-ve',                     [LoaiVeController::class, 'store']);
        Route::put('/loai-ve/{ma}',                 [LoaiVeController::class, 'update']);
        Route::patch('/loai-ve/{ma}/trang-thai',    [LoaiVeController::class, 'toggleTrangThai']);


        Route::get('/quy-tac',                      [QuyTacController::class, 'index']);
        Route::get('/quy-tac/{ma}',                 [QuyTacController::class, 'show']);
        Route::post('/quy-tac',                     [QuyTacController::class, 'store']);
        Route::put('/quy-tac/{ma}',                 [QuyTacController::class, 'update']);
        Route::patch('/quy-tac/{ma}/trang-thai',    [QuyTacController::class, 'toggleTrangThai']);
        

        Route::get('/hang-thanh-vien/tuy-chon',     [HangThanhVienController::class, 'tuyChon']);
        Route::get('/hang-thanh-vien',              [HangThanhVienController::class, 'index']);
        Route::get('/hang-thanh-vien/{ma}',         [HangThanhVienController::class, 'show']);
        Route::post('/hang-thanh-vien',             [HangThanhVienController::class, 'store']);
        Route::put('/hang-thanh-vien/{ma}',         [HangThanhVienController::class, 'update']);
        Route::delete('/hang-thanh-vien/{ma}',      [HangThanhVienController::class, 'destroy']);
        
        Route::get('/nhan-vien',                    [NhanVienController::class, 'index']);
        Route::get('/nhan-vien/{ma}',               [NhanVienController::class, 'show']);
        Route::post('/nhan-vien',                   [NhanVienController::class, 'store']);
        Route::put('/nhan-vien/{ma}',               [NhanVienController::class, 'update']);
        Route::patch('/nhan-vien/{ma}/trang-thai',  [NhanVienController::class, 'toggleTrangThai']);

        Route::get('/khach-hang/tuy-chon',          [KhachHangController::class, 'tuyChon']);
        Route::get('/khach-hang',                   [KhachHangController::class, 'index']);
        Route::get('/khach-hang/{ma}',              [KhachHangController::class, 'show']);
        Route::put('/khach-hang/{ma}',              [KhachHangController::class, 'update']);
        Route::patch('/khach-hang/{ma}/trang-thai', [KhachHangController::class, 'toggleTrangThai']);

        Route::get('/thong-bao/tuy-chon',           [ThongBaoController::class, 'tuyChon']);
        Route::get('/thong-bao',                    [ThongBaoController::class, 'index']);
        Route::post('/thong-bao',                   [ThongBaoController::class, 'store']);

        Route::get('/phan-hoi',                     [PhanHoiController::class, 'index']);
        Route::get('/phan-hoi/{ma}',                [PhanHoiController::class, 'show']);
        Route::patch('/phan-hoi/{ma}/tra-loi',      [PhanHoiController::class, 'traLoi']);

        Route::get('/lich-su-quy-tac',              [QuyTacController::class, 'lichSu']);

        Route::get('/lich-su-hang',                 [KhachHangController::class, 'lichSuHang']);

        Route::get('/lich-su-diem',                 [KhachHangController::class, 'lichSuDiem']);

        Route::get('/thong-ke/tong-quan',           [ThongKeController::class, 'tongQuan']);
        Route::get('/thong-ke/chi-tiet',            [ThongKeController::class, 'chiTiet']);

        Route::get('/web-setting',                  [WebSettingController::class, 'show']);
        Route::put('/web-setting',                  [WebSettingController::class, 'update']);
    });
   

});


// ------- ADMIN --------
Route::middleware('staff:Admin')->prefix('admin')->group(function () {
    Route::get('/uu-dai/tuy-chon', [UuDaiController::class, 'tuyChon']);
    Route::get('/uu-dai', [UuDaiController::class, 'index']);
    Route::get('/uu-dai/{ma}', [UuDaiController::class, 'show']);
    Route::post('/uu-dai', [UuDaiController::class, 'store']);
    Route::put('/uu-dai/{ma}', [UuDaiController::class, 'update']);
    Route::patch('/uu-dai/{ma}/trang-thai', [UuDaiController::class, 'toggleTrangThai']);

    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Chỉ Admin mới truy cập được.'
        ]);
    });

   


    Route::get('/loai-ve', [LoaiVeController::class, 'adminIndex']);
    Route::post('/loai-ve', [LoaiVeController::class, 'store']);
    Route::put('/loai-ve/{ma}', [LoaiVeController::class, 'update']);
    Route::patch('/loai-ve/{ma}/trang-thai', [LoaiVeController::class, 'toggleTrangThai']);

});


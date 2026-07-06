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
use App\Http\Controllers\Api\Admin\UuDaiController;


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
});

/*
|--------------------------------------------------------------------------
| STAFF
|--------------------------------------------------------------------------
*/



    // Các API nhân viên khác...

Route::middleware('auth:nhanvien')->group(function () {

    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/profile',  [AuthController::class, 'staffProfile']);
 
    // Loại vé
    Route::get('/loai-ve', [LoaiVeController::class, 'index']);
 
    // Tra cứu khách hàng
    Route::post('/khach-hang/lookup', [TraCuuKhachHangController::class, 'lookup']);
 
    // Hóa đơn
    Route::post('/hoa-don',           [HoaDonController::class, 'store']);
    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'show']);
 
    Route::get('/quan-ly-hoa-don',              [QuanLyHoaDonController::class, 'index']);
    Route::get('/quan-ly-hoa-don/{maHD}',       [QuanLyHoaDonController::class, 'show']);
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

        
    });
   
});




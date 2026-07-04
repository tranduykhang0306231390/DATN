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

Route::middleware('staff:Admin,NhanVien')->prefix('staff')->group(function () {

    Route::get('/profile', [AuthController::class, 'staffProfile']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/loai-ve', [HoaDonController::class, 'getLoaiVe']);

    Route::post('/khach-hang/lookup', [HoaDonController::class, 'lookupKhachHang']);

    Route::post('/hoa-don', [HoaDonController::class, 'taoHoaDon']);

    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'chiTietHoaDon']);

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
 
    
   
});

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

Route::middleware('staff:Admin')->prefix('admin')->group(function () {

    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Chỉ Admin mới truy cập được.'
        ]);
    });

    // API admin...
}); 
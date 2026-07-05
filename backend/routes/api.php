<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HoaDonController;
use App\Http\Controllers\Api\LoaiVeController;
use App\Http\Controllers\Api\TraCuuKhachHangController;
use App\Http\Controllers\Api\QuanLyHoaDonController;
use App\Http\Controllers\Api\Admin\UuDaiController;

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/member/register', [AuthController::class, 'register']);



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
    });
   
});



Route::middleware('auth:khachhang')->group(function () {

    Route::get('/member/profile', [AuthController::class, 'memberProfile']);

    Route::post('/member/logout',  [AuthController::class, 'logout']);
    

});
Route::post('/logout', [AuthController::class, 'logout']);


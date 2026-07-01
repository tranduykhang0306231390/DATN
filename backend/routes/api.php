<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
<<<<<<< HEAD
use App\Http\Controllers\Api\MemberPointController;
use App\Http\Controllers\Api\MemberHistoryController;

/*
|--------------------------------------------------------------------------
| Public API — Không cần đăng nhập
|--------------------------------------------------------------------------
*/

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/member/register', [AuthController::class, 'register']);
Route::post('/staff/login',  [AuthController::class, 'staffLogin']);
Route::post('/logout',       [AuthController::class, 'logout']);
=======
use App\Http\Controllers\Api\HoaDonController;

Route::post('/member/login', [AuthController::class, 'memberLogin']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);
Route::post('/member/register', [AuthController::class, 'register']);

>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763


<<<<<<< HEAD
/*
|--------------------------------------------------------------------------
| Vùng KHÁCH HÀNG — middleware 'member'
| Chỉ token của guard khachhang mới vào được.
| Nhân viên dù có token hợp lệ cũng bị chặn tại đây.
|--------------------------------------------------------------------------
*/
=======
    Route::post('/staff/logout', [AuthController::class, 'logout']);

    Route::get('/staff/profile',   [AuthController::class, 'staffProfile']);

    Route::get('/loai-ve',[HoaDonController::class, 'getLoaiVe']);

    Route::post('/khach-hang/lookup',[HoaDonController::class, 'lookupKhachHang']);

    Route::post('/hoa-don', [HoaDonController::class, 'taoHoaDon']);

    Route::get('/hoa-don/{maHoaDon}', [HoaDonController::class, 'chiTietHoaDon']);
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763

Route::middleware('member')->prefix('member')->group(function () {

    Route::get('/profile', [AuthController::class, 'memberProfile']);
    Route::get('/points',  [MemberPointController::class, 'index']);
    Route::get('/history', [MemberHistoryController::class, 'index']);
    // Thêm các API khách hàng ở đây
    // Route::get('/history',     [PointHistoryController::class, 'index']);
    // Route::get('/vouchers',    [VoucherController::class, 'myVouchers']);
    // Route::post('/redeem',     [VoucherController::class, 'redeem']);
    // Route::get('/feedback',    [FeedbackController::class, 'index']);
    // Route::post('/feedback',   [FeedbackController::class, 'store']);
    // Route::get('/invoices',    [InvoiceController::class, 'myInvoices']);
    // Route::get('/notifications', [NotificationController::class, 'index']);
});

<<<<<<< HEAD
=======


Route::middleware('auth:khachhang')->group(function () {
>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763

/*
|--------------------------------------------------------------------------
| Vùng NHÂN VIÊN — middleware 'staff' (Admin + NhanVien)
| Chỉ token của guard nhanvien mới vào được.
| Khách hàng dù có token hợp lệ cũng bị chặn tại đây.
|--------------------------------------------------------------------------
*/

<<<<<<< HEAD
Route::middleware('staff:Admin,NhanVien')->prefix('staff')->group(function () {

    Route::get('/profile', [AuthController::class, 'staffProfile']);

    // Thêm các API nhân viên ở đây
    // Route::post('/invoice',          [InvoiceController::class, 'store']);
    // Route::get('/invoice/{id}',      [InvoiceController::class, 'show']);
    // Route::get('/customer/search',   [CustomerController::class, 'search']);
    // Route::get('/customer/{id}',     [CustomerController::class, 'show']);
    // Route::post('/member/add-point', [MemberPointController::class, 'addPoint']);
    // Route::get('/feedback',          [FeedbackController::class, 'index']);
    // Route::post('/feedback/{id}/reply', [FeedbackController::class, 'reply']);
});


/*
|--------------------------------------------------------------------------
| Vùng ADMIN — middleware 'staff:Admin'
| Chỉ nhân viên có VaiTro = 'Admin' mới vào được.
|--------------------------------------------------------------------------
*/

Route::middleware('staff:Admin')->prefix('admin')->group(function () {

    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Chỉ Admin mới truy cập được.'
        ]);
    });

    // Quản lý nhân viên
    // Route::apiResource('/staff',   StaffController::class);

    // Quản lý quy tắc tích điểm
    // Route::apiResource('/rule',    RuleController::class);

    // Quản lý hạng thành viên
    // Route::apiResource('/tier',    TierController::class);

    // Quản lý ưu đãi / voucher
    // Route::apiResource('/promo',   PromoController::class);

    // Quản lý loại vé
    // Route::apiResource('/ticket',  TicketTypeController::class);

    // Báo cáo / thống kê
    // Route::get('/dashboard',       [DashboardController::class, 'index']);
    // Route::get('/report/revenue',  [ReportController::class, 'revenue']);
    // Route::get('/report/points',   [ReportController::class, 'points']);
});
=======
    Route::post('/member/logout',  [AuthController::class, 'logout']);
    

});
Route::post('/logout', [AuthController::class, 'logout']);

>>>>>>> 6605e29e98dff2a474acf8ecbecbaca207846763

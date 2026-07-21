<?php

namespace Tests\Feature;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Models\KhachHang;
use App\Models\NhanVien;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\Support\FakePhoneVerificationProvider;
use Tests\Support\InteractsWithCustomerAuthSchema;
use Tests\TestCase;

class StaffCustomerRegistrationTest extends TestCase
{
    use InteractsWithCustomerAuthSchema;

    private FakePhoneVerificationProvider $fakeFirebase;
    private NhanVien $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpCustomerAuthSchema();

        DB::table('hangthanhvien')->insert([
            'MaHangThanhVien' => 'HTV001',
            'TenHang' => 'Thành viên',
            'ThuTuHang' => 1,
            'DiemToiThieu' => 0,
        ]);

        NhanVien::create([
            'MaNhanVien' => 'NV001',
            'HoTen' => 'Le Thi B',
            'TenDangNhap' => 'le.b',
            'MatKhau' => Hash::make('MatKhauNhanVien@1'),
            'VaiTro' => 'NhanVien',
            'TrangThai' => 'HoatDong',
        ]);
        $this->staff = NhanVien::findOrFail('NV001');

        $this->fakeFirebase = new FakePhoneVerificationProvider();
        $this->app->instance(PhoneVerificationProviderInterface::class, $this->fakeFirebase);
    }

    protected function tearDown(): void
    {
        $this->tearDownCustomerAuthSchema();
        parent::tearDown();
    }

    private function staffHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . JWTAuth::fromUser($this->staff)];
    }

    public function test_active_staff_can_register_customer_after_customer_confirms_otp(): void
    {
        $this->fakeFirebase->willVerify('otp-token', '+84356522518', 'uid-1');

        $response = $this->postJson('/api/khach-hang/dang-ky', [
            'HoTen' => 'Khach Vang Lai',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '1998-05-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'otp-token',
        ], $this->staffHeaders());

        $response->assertStatus(200)->assertJson(['success' => true]);

        $customer = KhachHang::where('SoDienThoai', '0356522518')->first();
        $this->assertNotNull($customer);
        $this->assertSame('NV001', $customer->created_by_employee_id);
        $this->assertNotNull($customer->phone_verified_at);
        // Nhân viên không được trả về password hash.
        $this->assertArrayNotHasKey('MatKhau', $response->json('data'));
    }

    public function test_unauthenticated_caller_cannot_register_customer_on_behalf_of_someone(): void
    {
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $this->postJson('/api/khach-hang/dang-ky', [
            'HoTen' => 'Khach Vang Lai',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '1998-05-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'otp-token',
        ])->assertStatus(401);

        $this->assertSame(0, KhachHang::count());
    }

    public function test_staff_cannot_skip_otp_by_omitting_firebase_token(): void
    {
        $response = $this->postJson('/api/khach-hang/dang-ky', [
            'HoTen' => 'Khach Vang Lai',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '1998-05-01',
            'GioiTinh' => 'Nam',
        ], $this->staffHeaders());

        $response->assertStatus(422);
        $this->assertSame(0, KhachHang::count());
    }

    public function test_staff_cannot_register_a_phone_number_different_from_the_verified_otp_phone(): void
    {
        // Khách hàng thực sự xác minh OTP cho SĐT A, nhưng nhân viên gõ nhầm SĐT B.
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $response = $this->postJson('/api/khach-hang/dang-ky', [
            'HoTen' => 'Khach Vang Lai',
            'SoDienThoai' => '0900000000',
            'NgaySinh' => '1998-05-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'otp-token',
        ], $this->staffHeaders());

        $response->assertStatus(422);
        $this->assertSame(0, KhachHang::count());
    }

    public function test_staff_cannot_register_a_phone_number_that_already_has_an_account(): void
    {
        KhachHang::create([
            'MaKhachHang' => 'KH001',
            'HoTen' => 'Khach Cu',
            'SoDienThoai' => '0356522518',
            'MatKhau' => Hash::make('0356522518'),
            'MaHangThanhVien' => 'HTV001',
        ]);

        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $this->postJson('/api/khach-hang/dang-ky', [
            'HoTen' => 'Khach Vang Lai',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '1998-05-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'otp-token',
        ], $this->staffHeaders())->assertStatus(422);

        $this->assertSame(1, KhachHang::count());
    }

    public function test_check_phone_endpoint_requires_staff_authentication(): void
    {
        $this->postJson('/api/khach-hang/dang-ky/kiem-tra-so-dien-thoai', [
            'SoDienThoai' => '0356522518',
        ])->assertStatus(401);
    }
}

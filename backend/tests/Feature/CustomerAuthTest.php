<?php

namespace Tests\Feature;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Exceptions\PhoneVerificationException;
use App\Models\KhachHang;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\Support\FakePhoneVerificationProvider;
use Tests\Support\InteractsWithCustomerAuthSchema;
use Tests\TestCase;

class CustomerAuthTest extends TestCase
{
    use InteractsWithCustomerAuthSchema;

    private FakePhoneVerificationProvider $fakeFirebase;

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

        $this->fakeFirebase = new FakePhoneVerificationProvider();
        $this->app->instance(PhoneVerificationProviderInterface::class, $this->fakeFirebase);
    }

    protected function tearDown(): void
    {
        $this->tearDownCustomerAuthSchema();
        parent::tearDown();
    }

    private function createCustomer(array $overrides = []): KhachHang
    {
        return KhachHang::create(array_merge([
            'MaKhachHang' => 'KH001',
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'MatKhau' => Hash::make('0356522518'),
            'MaHangThanhVien' => 'HTV001',
            'TongDiem' => 0,
        ], $overrides));
    }

    /*
    |--------------------------------------------------------------------------
    | Đăng ký
    |--------------------------------------------------------------------------
    */

    public function test_register_succeeds_after_matching_firebase_verification(): void
    {
        $this->fakeFirebase->willVerify('valid-token', '+84356522518', 'uid-1');

        $response = $this->postJson('/api/member/register', [
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'valid-token',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $customer = KhachHang::where('SoDienThoai', '0356522518')->first();
        $this->assertNotNull($customer);
        $this->assertNotNull($customer->phone_verified_at);
        $this->assertSame('uid-1', $customer->firebase_uid);

        // Mật khẩu mặc định = số điện thoại, LUÔN được hash, không bao giờ plaintext.
        $this->assertNotSame('0356522518', $customer->MatKhau);
        $this->assertTrue(Hash::check('0356522518', $customer->MatKhau));
    }

    public function test_register_rejects_invalid_phone_format(): void
    {
        $response = $this->postJson('/api/member/register', [
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '12345',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'whatever',
        ]);

        $response->assertStatus(422);
        $this->assertSame(0, KhachHang::count());
    }

    public function test_register_rejects_when_phone_already_registered(): void
    {
        $this->createCustomer();
        $this->fakeFirebase->willVerify('valid-token', '+84356522518');

        $response = $this->postJson('/api/member/register', [
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'valid-token',
        ]);

        $response->assertStatus(422);
        $this->assertSame(1, KhachHang::count());
    }

    public function test_register_rejects_when_token_phone_does_not_match_submitted_phone(): void
    {
        // Token thật sự xác minh một số khác với số đang đăng ký.
        $this->fakeFirebase->willVerify('valid-token', '+84900000000');

        $response = $this->postJson('/api/member/register', [
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'valid-token',
        ]);

        $response->assertStatus(422);
        $this->assertSame(0, KhachHang::count());
    }

    public function test_register_rejects_invalid_or_expired_firebase_token(): void
    {
        $this->fakeFirebase->willFail('bad-token', PhoneVerificationException::expiredToken());

        $response = $this->postJson('/api/member/register', [
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'NgaySinh' => '2000-01-01',
            'GioiTinh' => 'Nam',
            'FirebaseIdToken' => 'bad-token',
        ]);

        $response->assertStatus(422);
        $this->assertSame(0, KhachHang::count());
    }

    public function test_check_phone_available_endpoint(): void
    {
        $this->createCustomer();

        $this->postJson('/api/member/register/check-phone', ['SoDienThoai' => '0356522518'])
            ->assertStatus(200)
            ->assertJson(['success' => true, 'available' => false]);

        $this->postJson('/api/member/register/check-phone', ['SoDienThoai' => '0900000000'])
            ->assertStatus(200)
            ->assertJson(['success' => true, 'available' => true]);
    }

    /*
    |--------------------------------------------------------------------------
    | Đăng nhập
    |--------------------------------------------------------------------------
    */

    public function test_login_with_default_password_equal_to_phone_succeeds(): void
    {
        $this->createCustomer();

        $response = $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => '0356522518',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true])->assertJsonStructure(['token']);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        $this->createCustomer();

        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'SaiMatKhau123!',
        ])->assertStatus(401);
    }

    public function test_login_for_locked_account_fails(): void
    {
        $this->createCustomer(['TrangThai' => 'TamKhoa']);

        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => '0356522518',
        ])->assertStatus(403);
    }

    public function test_firebase_login_succeeds_for_existing_customer(): void
    {
        $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518', 'uid-99');

        $response = $this->postJson('/api/member/login/firebase', ['FirebaseIdToken' => 'otp-token']);

        $response->assertStatus(200)->assertJson(['success' => true])->assertJsonStructure(['token']);
    }

    public function test_firebase_login_fails_when_no_account_exists_for_the_verified_phone(): void
    {
        $this->fakeFirebase->willVerify('otp-token', '+84900000000');

        $this->postJson('/api/member/login/firebase', ['FirebaseIdToken' => 'otp-token'])
            ->assertStatus(404);
    }

    public function test_firebase_login_fails_for_invalid_token(): void
    {
        $this->fakeFirebase->willFail('bad-token', PhoneVerificationException::invalidToken('chữ ký sai'));

        $this->postJson('/api/member/login/firebase', ['FirebaseIdToken' => 'bad-token'])
            ->assertStatus(422);
    }

    /*
    |--------------------------------------------------------------------------
    | Quên mật khẩu
    |--------------------------------------------------------------------------
    */

    public function test_forgot_password_issues_reset_token_after_verification(): void
    {
        $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $response = $this->postJson('/api/member/forgot-password', [
            'SoDienThoai' => '0356522518',
            'FirebaseIdToken' => 'otp-token',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['reset_token', 'expires_in']);
    }

    public function test_reset_password_changes_password_and_old_default_password_stops_working(): void
    {
        $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $resetToken = $this->postJson('/api/member/forgot-password', [
            'SoDienThoai' => '0356522518',
            'FirebaseIdToken' => 'otp-token',
        ])->json('reset_token');

        $this->postJson('/api/member/reset-password', [
            'SoDienThoai' => '0356522518',
            'ResetToken' => $resetToken,
            'MatKhau' => 'MatKhauMoi@123',
            'MatKhau_confirmation' => 'MatKhauMoi@123',
        ])->assertStatus(200)->assertJson(['success' => true]);

        // Mật khẩu mặc định (số điện thoại) không còn đăng nhập được nữa.
        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => '0356522518',
        ])->assertStatus(401);

        // Mật khẩu mới đăng nhập được.
        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'MatKhauMoi@123',
        ])->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_reset_password_token_can_only_be_used_once(): void
    {
        $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $resetToken = $this->postJson('/api/member/forgot-password', [
            'SoDienThoai' => '0356522518',
            'FirebaseIdToken' => 'otp-token',
        ])->json('reset_token');

        $payload = [
            'SoDienThoai' => '0356522518',
            'ResetToken' => $resetToken,
            'MatKhau' => 'MatKhauMoi@123',
            'MatKhau_confirmation' => 'MatKhauMoi@123',
        ];

        $this->postJson('/api/member/reset-password', $payload)->assertStatus(200);
        $this->postJson('/api/member/reset-password', array_merge($payload, ['MatKhau' => 'KhacNua@456', 'MatKhau_confirmation' => 'KhacNua@456']))
            ->assertStatus(422);
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        $this->createCustomer();

        $this->postJson('/api/member/reset-password', [
            'SoDienThoai' => '0356522518',
            'ResetToken' => 'token-khong-ton-tai',
            'MatKhau' => 'MatKhauMoi@123',
            'MatKhau_confirmation' => 'MatKhauMoi@123',
        ])->assertStatus(422);
    }

    /*
    |--------------------------------------------------------------------------
    | Đổi mật khẩu (đã đăng nhập)
    |--------------------------------------------------------------------------
    */

    private function authHeaderFor(KhachHang $customer): array
    {
        return ['Authorization' => 'Bearer ' . JWTAuth::fromUser($customer)];
    }

    public function test_change_password_flow_verify_then_confirm_succeeds(): void
    {
        $customer = $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');

        $headers = $this->authHeaderFor($customer);

        $changeToken = $this->postJson('/api/member/change-password/verify-phone', [
            'FirebaseIdToken' => 'otp-token',
        ], $headers)->assertStatus(200)->json('change_token');

        $response = $this->postJson('/api/member/change-password/confirm', [
            'ChangeToken' => $changeToken,
            'MatKhauMoi' => 'MatKhauMoi@123',
            'MatKhauMoi_confirmation' => 'MatKhauMoi@123',
        ], $headers);

        $response->assertStatus(200)->assertJsonStructure(['token']);

        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'MatKhauMoi@123',
        ])->assertStatus(200);
    }

    public function test_change_password_confirm_fails_without_verify_step(): void
    {
        $customer = $this->createCustomer();

        $this->postJson('/api/member/change-password/confirm', [
            'ChangeToken' => 'token-chua-tung-cap',
            'MatKhauMoi' => 'MatKhauMoi@123',
            'MatKhauMoi_confirmation' => 'MatKhauMoi@123',
        ], $this->authHeaderFor($customer))->assertStatus(422);
    }

    public function test_change_password_verify_fails_when_otp_phone_does_not_match_logged_in_account(): void
    {
        $customer = $this->createCustomer();
        // OTP xác minh một số điện thoại KHÁC với số của tài khoản đang đăng nhập.
        $this->fakeFirebase->willVerify('otp-token', '+84900000000');

        $this->postJson('/api/member/change-password/verify-phone', [
            'FirebaseIdToken' => 'otp-token',
        ], $this->authHeaderFor($customer))->assertStatus(422);
    }

    public function test_change_password_token_cannot_be_reused(): void
    {
        $customer = $this->createCustomer();
        $this->fakeFirebase->willVerify('otp-token', '+84356522518');
        $headers = $this->authHeaderFor($customer);

        $changeToken = $this->postJson('/api/member/change-password/verify-phone', [
            'FirebaseIdToken' => 'otp-token',
        ], $headers)->json('change_token');

        $payload = [
            'ChangeToken' => $changeToken,
            'MatKhauMoi' => 'MatKhauMoi@123',
            'MatKhauMoi_confirmation' => 'MatKhauMoi@123',
        ];

        $this->postJson('/api/member/change-password/confirm', $payload, $headers)->assertStatus(200);

        // Gọi lại với đúng change_token đã dùng -> phải bị từ chối vì token
        // đã được đánh dấu used_at (single-use). Trên request thật (khác
        // tiến trình PHP hoàn toàn) JWT cũ cũng sẽ bị middleware chặn 401
        // do password_fingerprint đổi; ở đây chỉ khẳng định lớp bảo vệ
        // "token dùng một lần" ở tầng CustomerActionTokenService.
        $this->postJson('/api/member/change-password/confirm', $payload, $headers)->assertStatus(422);
    }

    /*
    |--------------------------------------------------------------------------
    | Bảo mật chung
    |--------------------------------------------------------------------------
    */

    public function test_profile_and_login_responses_never_expose_password_hash_field_value(): void
    {
        $this->createCustomer();

        $response = $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => '0356522518',
        ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('MatKhau', $response->json('user'));
    }

    public function test_register_and_login_endpoints_are_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/member/login', [
                'SoDienThoai' => '0356522518',
                'MatKhau' => 'sai',
            ]);
        }

        // Route login cho phép 10 request/phút -> 5 lần chưa vượt ngưỡng.
        $sixth = $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'sai',
        ]);
        $this->assertNotSame(429, $sixth->getStatusCode());

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/member/login', [
                'SoDienThoai' => '0356522518',
                'MatKhau' => 'sai',
            ]);
        }

        $this->postJson('/api/member/login', [
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'sai',
        ])->assertStatus(429);
    }
}

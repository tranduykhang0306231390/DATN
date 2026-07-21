<?php

namespace Tests\Unit;

use App\Models\KhachHang;
use App\Services\CustomerActionTokenService;
use Tests\Support\InteractsWithCustomerAuthSchema;
use Tests\TestCase;

class CustomerActionTokenServiceTest extends TestCase
{
    use InteractsWithCustomerAuthSchema;

    private CustomerActionTokenService $service;
    private KhachHang $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpCustomerAuthSchema();

        $this->service = new CustomerActionTokenService();

        KhachHang::create([
            'MaKhachHang' => 'KH001',
            'HoTen' => 'Nguyen Van A',
            'SoDienThoai' => '0356522518',
            'MatKhau' => 'hashed-password',
            'MaHangThanhVien' => 'HTV001',
        ]);
        $this->customer = KhachHang::findOrFail('KH001');
    }

    protected function tearDown(): void
    {
        $this->tearDownCustomerAuthSchema();
        parent::tearDown();
    }

    public function test_a_freshly_created_token_is_valid(): void
    {
        $token = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->assertTrue($this->service->isValid($token, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
    }

    public function test_token_can_only_be_consumed_once(): void
    {
        $token = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->assertTrue($this->service->consume($token, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
        $this->assertFalse($this->service->consume($token, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
    }

    public function test_issuing_a_new_token_invalidates_the_previous_unused_one(): void
    {
        $first = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);
        $second = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->assertFalse($this->service->consume($first, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
        $this->assertTrue($this->service->consume($second, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
    }

    public function test_a_token_expires_after_its_ttl(): void
    {
        $token = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->travel(CustomerActionTokenService::TTL_MINUTES + 1)->minutes();

        $this->assertFalse($this->service->consume($token, $this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
    }

    public function test_a_token_cannot_be_used_for_a_different_purpose(): void
    {
        $token = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->assertFalse($this->service->consume($token, $this->customer, CustomerActionTokenService::PURPOSE_CHANGE_PASSWORD));
    }

    public function test_a_token_cannot_be_used_for_a_different_customer(): void
    {
        KhachHang::create([
            'MaKhachHang' => 'KH002',
            'HoTen' => 'Nguyen Van B',
            'SoDienThoai' => '0356522519',
            'MatKhau' => 'hashed-password',
            'MaHangThanhVien' => 'HTV001',
        ]);
        $otherCustomer = KhachHang::findOrFail('KH002');

        $token = $this->service->create($this->customer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD);

        $this->assertFalse($this->service->consume($token, $otherCustomer, CustomerActionTokenService::PURPOSE_FORGOT_PASSWORD));
    }
}

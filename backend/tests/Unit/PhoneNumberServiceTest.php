<?php

namespace Tests\Unit;

use App\Services\PhoneNumberService;
use Tests\TestCase;

class PhoneNumberServiceTest extends TestCase
{
    private PhoneNumberService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PhoneNumberService();
    }

    public function test_it_accepts_local_format(): void
    {
        $this->assertSame('0356522518', $this->service->normalize('0356522518'));
    }

    public function test_it_normalizes_plus84_format_to_storage_format(): void
    {
        $this->assertSame('0356522518', $this->service->normalize('+84356522518'));
    }

    public function test_it_normalizes_84_without_plus(): void
    {
        $this->assertSame('0356522518', $this->service->normalize('84356522518'));
    }

    public function test_it_strips_spaces_dashes_and_dots(): void
    {
        $this->assertSame('0356522518', $this->service->normalize('035 652-25.18'));
    }

    public function test_it_rejects_too_short_number(): void
    {
        $this->assertNull($this->service->normalize('03565225'));
    }

    public function test_it_rejects_number_not_starting_with_zero_or_84(): void
    {
        $this->assertNull($this->service->normalize('1356522518'));
    }

    public function test_it_rejects_null_and_empty(): void
    {
        $this->assertNull($this->service->normalize(null));
        $this->assertNull($this->service->normalize(''));
        $this->assertNull($this->service->normalize('   '));
    }

    public function test_to_e164_converts_storage_format(): void
    {
        $this->assertSame('+84356522518', $this->service->toE164('0356522518'));
    }

    public function test_to_e164_returns_null_for_invalid_storage_format(): void
    {
        $this->assertNull($this->service->toE164('+84356522518'));
    }

    public function test_equals_treats_different_writings_of_same_number_as_equal(): void
    {
        $this->assertTrue($this->service->equals('0356522518', '+84356522518'));
        $this->assertTrue($this->service->equals('0356522518', '84 356 522 518'));
    }

    public function test_equals_is_false_for_different_numbers(): void
    {
        $this->assertFalse($this->service->equals('0356522518', '0356522519'));
    }
}

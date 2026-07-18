<?php

namespace Tests\Unit;

use App\Services\SequentialCodeService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use LogicException;
use Tests\TestCase;

class SequentialCodeServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('test_codes', function (Blueprint $table) {
            $table->string('code')->primary();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('test_codes');
        parent::tearDown();
    }

    public function test_it_sorts_the_numeric_suffix_and_expands_past_999(): void
    {
        DB::table('test_codes')->insert([
            ['code' => 'T9'],
            ['code' => 'T010'],
            ['code' => 'T999'],
        ]);

        $codes = DB::transaction(fn () => app(SequentialCodeService::class)
            ->nextBatch('test_codes', 'code', 'T', 2));

        $this->assertSame(['T1000', 'T1001'], $codes);
    }

    public function test_it_requires_a_transaction_so_the_lock_is_not_released_early(): void
    {
        $this->expectException(LogicException::class);

        app(SequentialCodeService::class)->next('test_codes', 'code', 'T');
    }
}

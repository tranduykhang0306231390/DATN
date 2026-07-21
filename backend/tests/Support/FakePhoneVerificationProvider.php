<?php

namespace Tests\Support;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Exceptions\PhoneVerificationException;
use App\Services\PhoneVerification\VerifiedPhoneNumber;

/**
 * Giả lập Firebase Admin SDK cho test: không gọi mạng thật, chỉ trả về
 * đúng những gì test đã cấu hình cho một chuỗi "token" cho trước.
 *
 * Dùng qua: $this->app->instance(PhoneVerificationProviderInterface::class, ...)
 */
class FakePhoneVerificationProvider implements PhoneVerificationProviderInterface
{
    /** @var array<string, VerifiedPhoneNumber> */
    private array $successMap = [];

    /** @var array<string, PhoneVerificationException> */
    private array $failureMap = [];

    public function willVerify(string $idToken, string $phoneNumberE164, string $uid = 'fake-uid'): static
    {
        $this->successMap[$idToken] = new VerifiedPhoneNumber($phoneNumberE164, $uid);
        return $this;
    }

    public function willFail(string $idToken, PhoneVerificationException $exception): static
    {
        $this->failureMap[$idToken] = $exception;
        return $this;
    }

    public function verify(string $idToken): VerifiedPhoneNumber
    {
        if (isset($this->failureMap[$idToken])) {
            throw $this->failureMap[$idToken];
        }

        if (isset($this->successMap[$idToken])) {
            return $this->successMap[$idToken];
        }

        throw PhoneVerificationException::invalidToken('Token giả không được cấu hình trong test.');
    }
}

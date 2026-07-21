<?php

namespace App\Contracts;

use App\Exceptions\PhoneVerificationException;
use App\Services\PhoneVerification\VerifiedPhoneNumber;

/**
 * Xác minh rằng người gọi API thực sự đang sở hữu một số điện thoại,
 * dựa trên một token do nhà cung cấp xác thực (hiện tại là Firebase
 * Phone Authentication) cấp sau khi người dùng nhập đúng OTP.
 *
 * Tách interface riêng để sau này có thể thay Firebase bằng Twilio hoặc
 * nhà cung cấp khác mà không phải sửa AuthController/FirebasePhoneAuthService.
 */
interface PhoneVerificationProviderInterface
{
    /**
     * @throws PhoneVerificationException nếu token không hợp lệ, đã hết
     *         hạn, không thuộc đúng project, hoặc không có số điện thoại.
     */
    public function verify(string $idToken): VerifiedPhoneNumber;
}

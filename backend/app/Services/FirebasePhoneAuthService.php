<?php

namespace App\Services;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Exceptions\PhoneVerificationException;

/**
 * Lớp nghiệp vụ duy nhất mà AuthController/StaffKhachHangController gọi
 * để xác minh một Firebase ID Token. Không đặt logic Firebase trực tiếp
 * trong controller (yêu cầu mục 8).
 *
 * Luôn trả về số điện thoại ở ĐỊNH DẠNG LƯU TRỮ "0xxxxxxxxx", không phải
 * E.164, để phần còn lại của ứng dụng không phải quan tâm định dạng Firebase.
 */
class FirebasePhoneAuthService
{
    public function __construct(
        private readonly PhoneVerificationProviderInterface $provider,
        private readonly PhoneNumberService $phoneNumbers,
    ) {}

    /**
     * Xác minh token, không so khớp với số điện thoại nào cụ thể.
     * Dùng cho các luồng mà số điện thoại đăng ký/thao tác được LẤY TỪ
     * chính token (ví dụ tự đăng ký), chứ không phải kiểm tra khớp với
     * một số đã biết trước.
     *
     * @throws PhoneVerificationException
     */
    public function verify(string $idToken): VerifiedFirebasePhone
    {
        $result = $this->provider->verify($idToken);

        $storagePhone = $this->phoneNumbers->normalize($result->phoneNumberE164);
        if ($storagePhone === null) {
            throw PhoneVerificationException::missingPhoneNumber();
        }

        return new VerifiedFirebasePhone(
            phoneInStorageFormat: $storagePhone,
            firebaseUid: $result->providerUid,
        );
    }

    /**
     * Xác minh token VÀ bắt buộc số điện thoại trong token phải khớp với
     * $expectedPhoneInStorageFormat (đã chuẩn hóa). Dùng cho mọi luồng có
     * một số điện thoại "đang thao tác" đã biết trước: đăng ký hộ (khớp số
     * nhân viên vừa nhập), đổi mật khẩu (khớp số của tài khoản đang đăng
     * nhập), quên mật khẩu (khớp số khách hàng nhập ở bước đầu).
     *
     * Không bao giờ chỉ tin số điện thoại do frontend tự khai báo — luôn
     * đối chiếu với giá trị đã được Firebase xác minh trong token.
     *
     * @throws PhoneVerificationException
     */
    public function verifyMatches(string $idToken, string $expectedPhoneInStorageFormat): VerifiedFirebasePhone
    {
        $verified = $this->verify($idToken);

        if (!$this->phoneNumbers->equals($verified->phoneInStorageFormat, $expectedPhoneInStorageFormat)) {
            throw PhoneVerificationException::phoneMismatch();
        }

        return $verified;
    }
}

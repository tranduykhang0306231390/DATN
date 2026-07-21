<?php

namespace App\Services\PhoneVerification;

use App\Contracts\PhoneVerificationProviderInterface;
use App\Exceptions\PhoneVerificationException;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\Exception\Auth\RevokedIdToken;
use Throwable;

/**
 * Xác minh Firebase ID Token bằng Firebase Admin SDK (kreait/laravel-firebase).
 *
 * Đây là NƠI DUY NHẤT trong ứng dụng gọi thẳng SDK Firebase để xác minh
 * token. Mọi luồng nghiệp vụ (đăng ký, đăng nhập, quên/đổi mật khẩu) đều
 * đi qua FirebasePhoneAuthService, không gọi lớp này trực tiếp.
 */
class FirebasePhoneVerificationProvider implements PhoneVerificationProviderInterface
{
    public function __construct(private readonly FirebaseAuth $auth) {}

    public function verify(string $idToken): VerifiedPhoneNumber
    {
        $idToken = trim($idToken);

        if ($idToken === '') {
            throw PhoneVerificationException::invalidToken('token rỗng.');
        }

        try {
            // checkIfRevoked: true -> nếu phiên đã bị thu hồi hoặc tài khoản
            // Firebase bị vô hiệu hóa, SDK sẽ ném RevokedIdToken.
            //
            // leewayInSeconds: đồng hồ hệ thống của server hiếm khi khớp
            // tuyệt đối với giờ thực (NTP trôi vài chục giây là bình thường,
            // đã đo thực tế trên môi trường dev lệch ~48s) — nếu không có
            // leeway, token hợp lệ do Google cấp đúng giờ thực có thể bị từ
            // chối nhầm với lỗi "issued in the future"/"expired". 60 giây là
            // mức khuyến nghị phổ biến để chịu được trôi giờ nhỏ mà không
            // làm yếu đáng kể việc kiểm tra hạn token.
            $verifiedToken = $this->auth->verifyIdToken($idToken, checkIfRevoked: true, leewayInSeconds: 60);
        } catch (RevokedIdToken) {
            throw PhoneVerificationException::accountDisabledOrRevoked();
        } catch (FailedToVerifyToken $e) {
            throw $this->mapFailedToVerifyToken($e);
        } catch (Throwable $e) {
            throw PhoneVerificationException::invalidToken($e->getMessage());
        }

        $claims = $verifiedToken->claims();

        $expectedProjectId = config('firebase.project_id');
        if (is_string($expectedProjectId) && $expectedProjectId !== '') {
            // Theo chuẩn JWT, "aud" có thể là 1 chuỗi hoặc 1 mảng chuỗi;
            // thư viện JWT bên dưới (Lcobucci) luôn chuẩn hóa "aud" thành
            // mảng khi parse claims, dù token gốc chỉ có 1 audience dạng
            // chuỗi. Phải kiểm tra cả hai dạng, nếu không sẽ luôn coi là
            // sai project dù thực chất khớp.
            $audience = $claims->get('aud');
            $audiences = is_array($audience) ? $audience : [$audience];

            if (!in_array($expectedProjectId, $audiences, true)) {
                throw PhoneVerificationException::wrongProject();
            }
        }

        $phoneNumber = $claims->get('phone_number');
        if (!is_string($phoneNumber) || $phoneNumber === '') {
            throw PhoneVerificationException::missingPhoneNumber();
        }

        $uid = $claims->get('sub');
        if (!is_string($uid) || $uid === '') {
            throw PhoneVerificationException::invalidToken('token không có "sub" (Firebase UID).');
        }

        return new VerifiedPhoneNumber(
            phoneNumberE164: $phoneNumber,
            providerUid: $uid,
        );
    }

    private function mapFailedToVerifyToken(FailedToVerifyToken $e): PhoneVerificationException
    {
        $message = strtolower($e->getMessage());

        if (str_contains($message, 'expired')) {
            return PhoneVerificationException::expiredToken();
        }

        if (str_contains($message, 'issuer') || str_contains($message, 'audience') || str_contains($message, 'project')) {
            return PhoneVerificationException::wrongProject();
        }

        return PhoneVerificationException::invalidToken($e->getMessage());
    }
}

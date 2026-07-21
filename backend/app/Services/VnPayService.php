<?php

namespace App\Services;

/**
 * Tích hợp cổng thanh toán VNPay (sandbox) cho cọc giữ chỗ đặt bàn.
 *
 * Chuẩn ký HMAC-SHA512 theo tài liệu tích hợp chính thức của VNPay —
 * build URL và xác thực callback dùng chung một cách dựng chuỗi hash.
 */
class VnPayService
{
    public function buildPaymentUrl(
        string $maDatBan,
        int $soTienVnd,
        string $ipAddress,
        string $orderInfo,
        \DateTimeInterface $expireAt
    ): string {
        $params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => config('vnpay.tmn_code'),
            'vnp_Amount' => $soTienVnd * 100,
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $maDatBan,
            'vnp_OrderInfo' => $orderInfo,
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => config('vnpay.return_url'),
            'vnp_IpAddr' => $ipAddress ?: '127.0.0.1',
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_ExpireDate' => $expireAt->format('YmdHis'),
        ];

        [$hashData, $query] = $this->buildHashDataAndQuery($params);

        $secureHash = hash_hmac('sha512', $hashData, (string) config('vnpay.hash_secret'));

        return rtrim((string) config('vnpay.pay_url'), '?') . '?' . $query . 'vnp_SecureHash=' . $secureHash;
    }

    /**
     * @param array<string, mixed> $query Toàn bộ query params VNPay gửi về callback.
     */
    public function verifyCallbackSignature(array $query): bool
    {
        $receivedHash = (string) ($query['vnp_SecureHash'] ?? '');

        if ($receivedHash === '') {
            return false;
        }

        unset($query['vnp_SecureHash'], $query['vnp_SecureHashType']);

        [$hashData] = $this->buildHashDataAndQuery($query);

        $expectedHash = hash_hmac('sha512', $hashData, (string) config('vnpay.hash_secret'));

        return hash_equals($expectedHash, $receivedHash);
    }

    /**
     * @param array<string, mixed> $params
     * @return array{0: string, 1: string} [hashData, query] — cùng thứ tự sắp xếp theo key.
     */
    private function buildHashDataAndQuery(array $params): array
    {
        ksort($params);

        $hashData = '';
        $query = '';
        $first = true;

        foreach ($params as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $encodedValue = urlencode((string) $value);

            $hashData .= ($first ? '' : '&') . $key . '=' . $encodedValue;
            $query .= $key . '=' . $encodedValue . '&';

            $first = false;
        }

        return [$hashData, $query];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DatBan;
use App\Services\ThongBaoService;
use App\Services\VnPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Webhook (IPN) xác nhận thanh toán cọc đặt bàn từ VNPay.
 *
 * VNPay gọi bằng GET (query string), KHÔNG qua middleware JWT — xác thực
 * bằng chữ ký riêng. Response BẮT BUỘC đúng format {RspCode, Message} theo
 * tài liệu VNPay, khác với convention {success,...} của phần còn lại của
 * API — đây là ngoại lệ có chủ đích, không phải thiếu nhất quán.
 */
class VnPayController extends Controller
{
    public function __construct(
        private VnPayService $vnPay,
        private ThongBaoService $thongBao
    ) {}

    public function callback(Request $request)
    {
        $query = $request->query();

        if (!$this->vnPay->verifyCallbackSignature($query)) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature']);
        }

        $maDatBan = (string) ($query['vnp_TxnRef'] ?? '');

        DB::beginTransaction();

        try {
            $datBan = DatBan::query()
                ->where('MaDatBan', $maDatBan)
                ->lockForUpdate()
                ->first();

            if (!$datBan) {
                DB::rollBack();

                return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
            }

            if ($datBan->TrangThaiCoc !== 'ChuaThanhToan') {
                DB::rollBack();

                return response()->json(['RspCode' => '02', 'Message' => 'Order already confirmed']);
            }

            $expectedAmount = (int) round((float) $datBan->SoTienCoc * 100);
            $receivedAmount = (int) ($query['vnp_Amount'] ?? 0);

            if ($receivedAmount !== $expectedAmount) {
                DB::rollBack();

                return response()->json(['RspCode' => '04', 'Message' => 'Invalid amount']);
            }

            $thanhCong = ($query['vnp_ResponseCode'] ?? null) === '00'
                && ($query['vnp_TransactionStatus'] ?? null) === '00';

            if ($thanhCong) {
                $datBan->TrangThaiCoc = 'DaThanhToan';
                $datBan->TrangThai = 'ChoXacNhan';
                $datBan->MaGiaoDichCoc = (string) ($query['vnp_TransactionNo'] ?? '');
                $datBan->save();

                $this->thongBao->gui(
                    $datBan->MaKhachHang,
                    'Đặt bàn đang chờ xác nhận',
                    "Đã nhận cọc cho lượt đặt bàn {$maDatBan}. Nhà hàng sẽ xác nhận và gán bàn trong thời gian sớm nhất."
                );
            }

            /*
             * Thanh toán thất bại: không đổi trạng thái — cron
             * datban:xu-ly-qua-han sẽ tự hủy khi hết hạn giữ chỗ.
             */

            DB::commit();

            return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
        } catch (\Throwable $exception) {
            DB::rollBack();

            Log::error('Lỗi xử lý callback VNPay', [
                'ma_dat_ban' => $maDatBan,
                'exception' => $exception,
            ]);

            return response()->json(['RspCode' => '99', 'Message' => 'Unknown error']);
        }
    }
}

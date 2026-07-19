<?php

namespace App\Services;

use App\Exceptions\MoBanKhongThanhCongException;
use App\Models\BanAn;
use App\Models\ChiTietHoaDon;
use App\Models\HoaDon;
use App\Models\LoaiVe;
use App\Models\NhanVien;

/**
 * Mở bàn: tạo hóa đơn treo + chi tiết vé.
 *
 * Tách ra từ HoaDonController::store() để dùng chung cho cả luồng mở bàn
 * tại quầy (staff) lẫn check-in từ một lượt đặt bàn trước — bản thân
 * service KHÔNG tự mở transaction, giả định luôn chạy trong transaction
 * của caller (giống ràng buộc của SequentialCodeService::next()).
 */
class MoBanService
{
    public function __construct(
        private SequentialCodeService $codes
    ) {}

    /**
     * @param array<int, array{MaLoaiVe: string, SoLuong: int}> $chiTietInput
     * @return array{MaHoaDon: string, SoBan: string, TongTien: float}
     *
     * @throws MoBanKhongThanhCongException
     */
    public function moBan(
        string $maBan,
        array $chiTietInput,
        NhanVien $nhanVien,
        ?string $maDatBan = null,
        ?string $maKhachHangGanTruoc = null
    ): array {
        $banAn = BanAn::query()
            ->where('MaBan', $maBan)
            ->lockForUpdate()
            ->first();

        if (!$banAn || $banAn->TrangThai !== 'HoatDong') {
            throw new MoBanKhongThanhCongException(
                "Bàn {$maBan} không khả dụng."
            );
        }

        $banDaDuocMo = HoaDon::query()
            ->where('SoBan', $maBan)
            ->where('TrangThai', 'ChuaThanhToan')
            ->lockForUpdate()
            ->exists();

        if ($banDaDuocMo) {
            throw new MoBanKhongThanhCongException(
                "Bàn {$banAn->TenBan} đang có hóa đơn chưa thanh toán."
            );
        }

        $maLoaiVeList = collect($chiTietInput)
            ->pluck('MaLoaiVe')
            ->sort()
            ->values();

        $ticketTypes = LoaiVe::query()
            ->whereIn('MaLoaiVe', $maLoaiVeList)
            ->orderBy('MaLoaiVe')
            ->lockForUpdate()
            ->get()
            ->keyBy('MaLoaiVe');

        $tongTien = 0;
        $chiTietData = [];

        foreach ($chiTietInput as $item) {
            $loaiVe = $ticketTypes->get($item['MaLoaiVe']);

            if (!$loaiVe || $loaiVe->TrangThai !== 'HoatDong') {
                throw new MoBanKhongThanhCongException(
                    "Loại vé {$item['MaLoaiVe']} không khả dụng."
                );
            }

            if (!$this->veHopLeThoiDiemNay($loaiVe)) {
                throw new MoBanKhongThanhCongException(
                    "Vé \"{$loaiVe->TenLoaiVe}\" không áp dụng cho thời điểm hiện tại."
                );
            }

            $soLuong = (int) $item['SoLuong'];
            $donGia = (float) $loaiVe->GiaVe;

            $tongTien += $donGia * $soLuong;

            $chiTietData[] = [
                'loaiVe' => $loaiVe,
                'SoLuong' => $soLuong,
                'DonGia' => $donGia,
            ];
        }

        $maHoaDon = $this->codes->next('hoadon', 'MaHoaDon', 'HD');

        HoaDon::create([
            'MaHoaDon' => $maHoaDon,
            'NgayLap' => now(),
            'TongTien' => $tongTien,
            'DiemTichLuy' => 0,
            'TrangThai' => 'ChuaThanhToan',
            'MaNhanVien' => $nhanVien->MaNhanVien,

            /*
             * Khách hàng thường chỉ được chọn khi thanh toán — trừ khi
             * đây là check-in từ một lượt đặt bàn đã gắn sẵn khách.
             */
            'MaKhachHang' => $maKhachHangGanTruoc,
            'MaQuyTacHienTai' => null,
            'MaHangThanhVien' => null,
            'MaVoucher' => null,

            'SoBan' => $maBan,
            'MaDatBan' => $maDatBan,
        ]);

        $detailCodes = $this->codes->nextBatch(
            'chitiethoadon',
            'MaChiTietHD',
            'CTHD',
            count($chiTietData)
        );

        foreach ($chiTietData as $index => $item) {
            ChiTietHoaDon::create([
                'MaChiTietHD' => $detailCodes[$index],
                'SoLuong' => $item['SoLuong'],
                'DonGia' => $item['DonGia'],
                'MaHoaDon' => $maHoaDon,
                'MaLoaiVe' => $item['loaiVe']->MaLoaiVe,
            ]);
        }

        return [
            'MaHoaDon' => $maHoaDon,
            'SoBan' => $maBan,
            'TongTien' => $tongTien,
        ];
    }

    private function veHopLeThoiDiemNay(LoaiVe $ve): bool
    {
        $now = now();

        $laCuoiTuan = in_array($now->dayOfWeek, [0, 6], true);
        $loaiNgayHienTai = $laCuoiTuan ? 'CuoiTuan' : 'NgayThuong';
        $buoiHienTai = $now->hour < 16 ? 'Trua' : 'Toi';

        return $ve->LoaiNgay === $loaiNgayHienTai
            && $ve->BuoiAn === $buoiHienTai;
    }
}

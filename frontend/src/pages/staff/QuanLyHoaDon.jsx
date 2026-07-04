// src/pages/staff/QuanLyHoaDon.jsx
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { quanLyHoaDonApi } from '../../api/hoaDonApi';
import '../../assets/css/staff.css';
import {
    fmt, fmtDate,
    PageTitle, StatCard, Th, Td,
    TrangThaiBadge, Pagination,
    Modal, InfoBlock, SumRow,
    LoadingBox, EmptyBox,
} from '../../components/staff/StaffComponents';

export default function QuanLyHoaDon() {
    const [tuNgay,    setTuNgay]    = useState('');
    const [denNgay,   setDenNgay]   = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [keyword,   setKeyword]   = useState('');

    const [hoaDons,    setHoaDons]    = useState([]);
    const [pagination, setPagination] = useState(null);
    const [thongKe,    setThongKe]    = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [page,       setPage]       = useState(1);

    const [detailOpen,    setDetailOpen]    = useState(false);
    const [detailData,    setDetailData]    = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchData = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await quanLyHoaDonApi.danhSach({
                tu_ngay:    tuNgay    || undefined,
                den_ngay:   denNgay   || undefined,
                trang_thai: trangThai || undefined,
                keyword:    keyword   || undefined,
                page: p, per_page: 10,
            });
            setHoaDons(res.data.data);
            setPagination(res.data.pagination);
            setThongKe(res.data.thong_ke);
            setPage(p);
        } catch {
            Swal.fire('Lỗi', 'Không tải được danh sách hóa đơn', 'error');
        } finally {
            setLoading(false);
        }
    }, [tuNgay, denNgay, trangThai, keyword]);

    useEffect(() => { fetchData(1); }, []);

    const handleSearch = (e) => { e.preventDefault(); fetchData(1); };
    const handleReset  = () => {
        setTuNgay(''); setDenNgay(''); setTrangThai(''); setKeyword('');
        setTimeout(() => fetchData(1), 0);
    };

    const handleDetail = async (maHD) => {
        setDetailOpen(true); setDetailData(null); setDetailLoading(true);
        try {
            const res = await quanLyHoaDonApi.chiTiet(maHD);
            setDetailData(res.data.data);
        } catch {
            Swal.fire('Lỗi', 'Không tải được chi tiết hóa đơn', 'error');
            setDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleHuy = async (maHD) => {
        const confirm = await Swal.fire({
            title: `Hủy hóa đơn ${maHD}?`,
            text: 'Điểm tích lũy sẽ bị hoàn lại, voucher sẽ được khôi phục.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });
        if (!confirm.isConfirmed) return;
        try {
            await quanLyHoaDonApi.huy(maHD);
            Swal.fire({ icon: 'success', title: 'Đã hủy hóa đơn', timer: 1500, showConfirmButton: false });
            setDetailOpen(false);
            fetchData(page);
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Có lỗi xảy ra', 'error');
        }
    };

    return (
        <div className="staff-page">
            <PageTitle>📋 Quản lý hóa đơn</PageTitle>

            {/* Thống kê */}
            {thongKe && (
                <div className="stat-row">
                    <StatCard label="Tổng hóa đơn" value={thongKe.tong_hoa_don}        color="#3b82f6" icon="🧾" />
                    <StatCard label="Doanh thu"     value={fmt(thongKe.tong_doanh_thu)} color="#16a34a" icon="💰" />
                </div>
            )}

            {/* Bộ lọc */}
            <div className="filter-card">
                <form className="filter-form" onSubmit={handleSearch}>
                    <div className="filter-group">
                        <label className="filter-label">Từ ngày</label>
                        <input type="date" className="staff-input" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Đến ngày</label>
                        <input type="date" className="staff-input" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Trạng thái</label>
                        <select className="staff-input" value={trangThai} onChange={(e) => setTrangThai(e.target.value)}>
                            <option value="">Tất cả</option>
                            <option value="DaThanhToan">Đã thanh toán</option>
                            <option value="DaHuy">Đã hủy</option>
                        </select>
                    </div>
                    <div className="filter-group" style={{ flex: 2 }}>
                        <label className="filter-label">Khách hàng</label>
                        <input className="staff-input" placeholder="Tên hoặc số điện thoại..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    </div>
                    <div className="filter-actions">
                        <button type="submit" className="btn-search">🔍 Tìm</button>
                        <button type="button" className="btn-reset" onClick={handleReset}>↺ Đặt lại</button>
                    </div>
                </form>
            </div>

            {/* Bảng danh sách */}
            <div className="staff-table-wrap">
                {loading ? <LoadingBox /> : hoaDons.length === 0 ? <EmptyBox text="Không có hóa đơn nào" /> : (
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <Th>Mã HĐ</Th>
                                <Th>Ngày lập</Th>
                                <Th>Khách hàng</Th>
                                <Th>Nhân viên</Th>
                                <Th align="right">Tổng tiền</Th>
                                <Th align="center">Điểm TL</Th>
                                <Th align="center">Trạng thái</Th>
                                <Th align="center">Thao tác</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {hoaDons.map((hd) => (
                                <tr key={hd.MaHoaDon}>
                                    <Td><span className="ma-hd">{hd.MaHoaDon}</span></Td>
                                    <Td>{fmtDate(hd.NgayLap)}</Td>
                                    <Td>
                                        {hd.khach_hang ? (
                                            <>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{hd.khach_hang.HoTen}</div>
                                                <div style={{ fontSize: 12, color: '#9ca3af' }}>{hd.khach_hang.SoDienThoai}</div>
                                            </>
                                        ) : <span style={{ fontSize: 12, color: '#9ca3af' }}>Khách vãng lai</span>}
                                    </Td>
                                    <Td>{hd.nhan_vien?.HoTen || '—'}</Td>
                                    <Td align="right" bold>{fmt(hd.TongTien)}</Td>
                                    <Td align="center">
                                        {hd.DiemTichLuy > 0
                                            ? <span className="badge badge-gold">+{hd.DiemTichLuy}</span>
                                            : '—'}
                                    </Td>
                                    <Td align="center"><TrangThaiBadge trangThai={hd.TrangThai} /></Td>
                                    <Td align="center">
                                        <button className="btn-detail" onClick={() => handleDetail(hd.MaHoaDon)}>Chi tiết</button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Phân trang */}
            <Pagination pagination={pagination} page={page} onPageChange={fetchData} />

            {/* Modal chi tiết */}
            <Modal open={detailOpen} onClose={() => setDetailOpen(false)}>
                {detailLoading || !detailData
                    ? <LoadingBox />
                    : <ChiTietModal data={detailData} onClose={() => setDetailOpen(false)} onHuy={handleHuy} />
                }
            </Modal>
        </div>
    );
}

// ─── Modal chi tiết ──────────────────────────────────────────────────────────
function ChiTietModal({ data, onClose, onHuy }) {
    const tongGoc = data.chi_tiet_hoa_don?.reduce((s, ct) => s + ct.DonGia * ct.SoLuong, 0) || 0;

    return (
        <>
            <div className="modal-header">
                <div>
                    <div className="modal-title">Chi tiết hóa đơn</div>
                    <div className="modal-sub">{data.MaHoaDon} · {fmtDate(data.NgayLap)}</div>
                </div>
                <button className="btn-close-modal" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
                <TrangThaiBadge trangThai={data.TrangThai} />

                <div className="info-grid" style={{ marginTop: 16 }}>
                    <InfoBlock title="Nhân viên lập">{data.nhan_vien?.HoTen || '—'}</InfoBlock>
                    <InfoBlock title="Khách hàng">
                        {data.khach_hang ? (
                            <>
                                <div>{data.khach_hang.HoTen}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>{data.khach_hang.SoDienThoai}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>Hạng: {data.khach_hang.hang_thanh_vien?.TenHang}</div>
                            </>
                        ) : 'Khách vãng lai'}
                    </InfoBlock>
                </div>

                <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', margin: '16px 0 8px' }}>Danh sách vé</div>
                <table className="staff-table">
                    <thead>
                        <tr>
                            <Th>Loại vé</Th>
                            <Th align="center">SL</Th>
                            <Th align="right">Đơn giá</Th>
                            <Th align="right">Thành tiền</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.chi_tiet_hoa_don?.map((ct) => (
                            <tr key={ct.MaChiTietHD}>
                                <Td>{ct.loai_ve?.TenLoaiVe}</Td>
                                <Td align="center">{ct.SoLuong}</Td>
                                <Td align="right">{fmt(ct.DonGia)}</Td>
                                <Td align="right" bold>{fmt(ct.DonGia * ct.SoLuong)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="summary-box">
                    <SumRow label="Tổng tiền gốc" value={fmt(tongGoc)} />
                    {(tongGoc - data.TongTien) > 0 && (
                        <SumRow label="Đã giảm" value={`−${fmt(tongGoc - data.TongTien)}`} color="#16a34a" />
                    )}
                    <SumRow label="Thanh toán"   value={fmt(data.TongTien)} bold accent />
                    {data.DiemTichLuy > 0 && (
                        <SumRow label="Điểm tích lũy" value={`+${data.DiemTichLuy} điểm`} color="#d97706" />
                    )}
                    {data.MaVoucher && (
                        <SumRow label="Voucher đã dùng" value={data.MaVoucher} />
                    )}
                </div>
            </div>

            <div className="modal-footer">
                <button className="btn-outline" onClick={onClose}>Đóng</button>
                {data.TrangThai === 'DaThanhToan' && (
                    <button className="btn-danger" onClick={() => onHuy(data.MaHoaDon)}>
                        🚫 Hủy hóa đơn
                    </button>
                )}
            </div>
        </>
    );
}
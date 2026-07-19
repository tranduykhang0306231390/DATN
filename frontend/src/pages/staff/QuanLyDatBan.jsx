// src/pages/staff/QuanLyDatBan.jsx
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import banAnApi from '../../api/banAnApi';
import hoaDonApi from '../../api/hoaDonApi';
import staffDatBanApi from '../../api/staffDatBanApi';
import Modal from '../../components/admin/Modal';

import '../../assets/css/admin.css';

const fmtMoney = (value) => {
    const number = Number(value);

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number.isFinite(number) ? number : 0);
};

const fmtDateTime = (value) => {
    if (!value) return '—';

    const date = new Date(String(value).replace(' ', 'T'));

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('vi-VN');
};

const TRANG_THAI_CONFIG = {
    ChoThanhToanCoc: { label: 'Chờ thanh toán cọc', background: '#f1f5f9', color: '#64748b' },
    ChoXacNhan: { label: 'Chờ xác nhận', background: '#fef3c7', color: '#b45309' },
    DaXacNhan: { label: 'Đã xác nhận', background: '#dbeafe', color: '#1d4ed8' },
    TuChoi: { label: 'Đã từ chối', background: '#fee2e2', color: '#b91c1c' },
    DaNhanBan: { label: 'Đã nhận bàn', background: '#dcfce7', color: '#15803d' },
    KhongDen: { label: 'Không đến', background: '#fee2e2', color: '#b91c1c' },
    DaHuy: { label: 'Đã hủy', background: '#f1f5f9', color: '#64748b' },
    HoanTat: { label: 'Hoàn tất', background: '#dcfce7', color: '#15803d' },
};

const getTrangThaiConfig = (trangThai) => (
    TRANG_THAI_CONFIG[trangThai] ?? { label: trangThai || 'Không xác định', background: '#f1f5f9', color: '#64748b' }
);

function TrangThaiBadge({ trangThai }) {
    const config = getTrangThaiConfig(trangThai);

    return (
        <span className="admin-badge" style={{ background: config.background, color: config.color }}>
            {config.label}
        </span>
    );
}

export default function QuanLyDatBan() {
    const [tab, setTab] = useState('danh-sach');

    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const [trangThai, setTrangThai] = useState('');
    const [ngay, setNgay] = useState('');
    const [page, setPage] = useState(1);

    const [hoanCocList, setHoanCocList] = useState([]);
    const [hoanCocPagination, setHoanCocPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [hoanCocLoading, setHoanCocLoading] = useState(false);
    const [hoanCocPage, setHoanCocPage] = useState(1);
    const [dangXuLyHoanTien, setDangXuLyHoanTien] = useState(null);

    const [banAnList, setBanAnList] = useState([]);
    const [loaiVeList, setLoaiVeList] = useState([]);

    // Modal xác nhận
    const [xacNhanTarget, setXacNhanTarget] = useState(null);
    const [maBanChon, setMaBanChon] = useState('');
    const [xacNhanSaving, setXacNhanSaving] = useState(false);

    // Modal check-in
    const [checkinTarget, setCheckinTarget] = useState(null);
    const [checkinCart, setCheckinCart] = useState({});
    const [checkinSaving, setCheckinSaving] = useState(false);

    const loadList = useCallback(async () => {
        setLoading(true);

        try {
            const response = await staffDatBanApi.getAll({
                trang_thai: trangThai,
                ngay,
                page,
                per_page: 20,
            });

            if (response.data?.success) {
                setList(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch {
            setList([]);
        } finally {
            setLoading(false);
        }
    }, [trangThai, ngay, page]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const loadHoanCocList = useCallback(async () => {
        setHoanCocLoading(true);

        try {
            const response = await staffDatBanApi.getCanHoanCoc({ page: hoanCocPage, per_page: 20 });

            if (response.data?.success) {
                setHoanCocList(response.data.data);
                setHoanCocPagination(response.data.pagination);
            }
        } catch {
            setHoanCocList([]);
        } finally {
            setHoanCocLoading(false);
        }
    }, [hoanCocPage]);

    useEffect(() => {
        if (tab === 'hoan-coc') void loadHoanCocList();
    }, [tab, loadHoanCocList]);

    const handleDanhDauHoanTien = async (datBan) => {
        const confirm = await Swal.fire({
            title: `Đánh dấu đã hoàn tiền cho ${datBan.MaDatBan}?`,
            text: `Xác nhận đã chuyển khoản ${fmtMoney(datBan.SoTienHoan)} cho khách hàng.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đã hoàn tiền',
            cancelButtonText: 'Đóng',
            confirmButtonColor: '#15803d',
        });

        if (!confirm.isConfirmed) return;

        setDangXuLyHoanTien(datBan.MaDatBan);

        try {
            await staffDatBanApi.danhDauHoanTien(datBan.MaDatBan);
            Swal.fire({ icon: 'success', title: 'Đã đánh dấu hoàn tiền', timer: 1500, showConfirmButton: false });
            loadHoanCocList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể đánh dấu hoàn tiền.', 'error');
        } finally {
            setDangXuLyHoanTien(null);
        }
    };

    useEffect(() => {
        banAnApi.getActive().then((res) => {
            if (res.data?.success) setBanAnList(res.data.data);
        }).catch(() => setBanAnList([]));

        hoaDonApi.getLoaiVe().then((res) => {
            if (res.data?.success) setLoaiVeList(res.data.data);
        }).catch(() => setLoaiVeList([]));
    }, []);

    const applyFilter = () => {
        if (page !== 1) setPage(1);
        else void loadList();
    };

    /*
    |--------------------------------------------------------------------------
    | Xác nhận
    |--------------------------------------------------------------------------
    */

    const openXacNhan = (datBan) => {
        setXacNhanTarget(datBan);
        setMaBanChon('');
    };

    const closeXacNhan = () => {
        if (xacNhanSaving) return;
        setXacNhanTarget(null);
    };

    const submitXacNhan = async () => {
        if (!maBanChon) {
            Swal.fire('Thiếu thông tin', 'Vui lòng chọn một bàn.', 'warning');
            return;
        }

        setXacNhanSaving(true);

        try {
            await staffDatBanApi.xacNhan(xacNhanTarget.MaDatBan, maBanChon);
            Swal.fire({ icon: 'success', title: 'Đã xác nhận', timer: 1500, showConfirmButton: false });
            setXacNhanTarget(null);
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể xác nhận.', 'error');
        } finally {
            setXacNhanSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Từ chối
    |--------------------------------------------------------------------------
    */

    const handleTuChoi = async (datBan) => {
        const { value: lyDo, isConfirmed } = await Swal.fire({
            title: `Từ chối lượt đặt ${datBan.MaDatBan}?`,
            input: 'textarea',
            inputLabel: 'Lý do từ chối (khách sẽ được hoàn 100% cọc)',
            inputPlaceholder: 'VD: Hết bàn phù hợp trong khung giờ này',
            showCancelButton: true,
            confirmButtonText: 'Từ chối',
            cancelButtonText: 'Đóng',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => (!value ? 'Vui lòng nhập lý do.' : undefined),
        });

        if (!isConfirmed || !lyDo) return;

        try {
            await staffDatBanApi.tuChoi(datBan.MaDatBan, lyDo);
            Swal.fire({ icon: 'success', title: 'Đã từ chối', timer: 1500, showConfirmButton: false });
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể từ chối.', 'error');
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Check-in
    |--------------------------------------------------------------------------
    */

    const openCheckin = (datBan) => {
        setCheckinTarget(datBan);
        setCheckinCart({});
    };

    const closeCheckin = () => {
        if (checkinSaving) return;
        setCheckinTarget(null);
    };

    const setSoLuongVe = (maLoaiVe, soLuong) => {
        setCheckinCart((current) => ({ ...current, [maLoaiVe]: Math.max(0, Number(soLuong) || 0) }));
    };

    const submitCheckin = async () => {
        const chiTiet = Object.entries(checkinCart)
            .filter(([, soLuong]) => soLuong > 0)
            .map(([MaLoaiVe, SoLuong]) => ({ MaLoaiVe, SoLuong }));

        if (chiTiet.length === 0) {
            Swal.fire('Thiếu thông tin', 'Vui lòng chọn ít nhất một loại vé.', 'warning');
            return;
        }

        setCheckinSaving(true);

        try {
            const res = await staffDatBanApi.checkin(checkinTarget.MaDatBan, chiTiet);
            await Swal.fire({
                icon: 'success',
                title: 'Đã check-in',
                text: `Đã mở hóa đơn ${res.data?.data?.MaHoaDon} tại ${checkinTarget.ban_an?.TenBan ?? ''}.`,
            });
            setCheckinTarget(null);
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể check-in.', 'error');
        } finally {
            setCheckinSaving(false);
        }
    };

    const banPhuHop = xacNhanTarget
        ? banAnList.filter((b) => Number(b.SucChua) >= Number(xacNhanTarget.SoLuongKhach))
        : [];

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Bán hàng</span>
                    <h2 className="admin-hero-title">Quản lý đặt bàn</h2>
                </div>
            </header>

            <div className="admin-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                    type="button"
                    className={`admin-btn admin-btn--sm ${tab === 'danh-sach' ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                    onClick={() => setTab('danh-sach')}
                >
                    Danh sách đặt bàn
                </button>
                <button
                    type="button"
                    className={`admin-btn admin-btn--sm ${tab === 'hoan-coc' ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                    onClick={() => setTab('hoan-coc')}
                >
                    Cần hoàn cọc
                </button>
            </div>

            {tab === 'danh-sach' && (
                <>
                    <div className="admin-toolbar">
                        <select className="admin-select" value={trangThai} onChange={(e) => { setTrangThai(e.target.value); setPage(1); }}>
                            <option value="">Mọi trạng thái</option>
                            {Object.entries(TRANG_THAI_CONFIG).map(([value, cfg]) => (
                                <option key={value} value={value}>{cfg.label}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="admin-input"
                            value={ngay}
                            onChange={(e) => { setNgay(e.target.value); setPage(1); }}
                        />
                        <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilter} disabled={loading}>
                            {loading ? 'Đang tải...' : 'Lọc'}
                        </button>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã đặt bàn</th>
                                    <th>Khách hàng</th>
                                    <th>Giờ đến</th>
                                    <th>Số khách</th>
                                    <th>Bàn</th>
                                    <th>Cọc</th>
                                    <th>Trạng thái</th>
                                    <th className="admin-th-action">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="admin-state">Đang tải…</td></tr>
                                ) : list.length === 0 ? (
                                    <tr><td colSpan={8} className="admin-state">Không có lượt đặt bàn nào.</td></tr>
                                ) : (
                                    list.map((datBan) => (
                                        <tr key={datBan.MaDatBan}>
                                            <td className="admin-mono">{datBan.MaDatBan}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{datBan.khach_hang?.HoTen ?? datBan.MaKhachHang}</div>
                                                {datBan.khach_hang?.SoDienThoai && (
                                                    <div style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>{datBan.khach_hang.SoDienThoai}</div>
                                                )}
                                            </td>
                                            <td className="admin-nowrap">{fmtDateTime(datBan.ThoiGianDat)}</td>
                                            <td>{datBan.SoLuongKhach}</td>
                                            <td>{datBan.ban_an?.TenBan ?? '—'}</td>
                                            <td>
                                                {fmtMoney(datBan.SoTienCoc)}
                                                {datBan.TrangThaiCoc === 'DaThanhToan' && (
                                                    <div style={{ marginTop: 2, color: '#15803d', fontSize: 12 }}>Đã thanh toán</div>
                                                )}
                                            </td>
                                            <td><TrangThaiBadge trangThai={datBan.TrangThai} /></td>
                                            <td className="admin-th-action">
                                                <div className="admin-row-actions">
                                                    {datBan.TrangThai === 'ChoXacNhan' && (
                                                        <>
                                                            <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => openXacNhan(datBan)}>
                                                                Xác nhận
                                                            </button>
                                                            <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleTuChoi(datBan)}>
                                                                Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {datBan.TrangThai === 'DaXacNhan' && (
                                                        <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => openCheckin(datBan)}>
                                                            Check-in
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.last_page > 1 && (
                        <div className="admin-pagination">
                            <button
                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                disabled={pagination.current_page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ← Trước
                            </button>
                            <span className="admin-page-info">
                                Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} lượt đặt
                            </span>
                            <button
                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {tab === 'hoan-coc' && (
                <>
                    <p style={{ marginTop: 0, marginBottom: 12, color: '#64748b', fontSize: 13 }}>
                        Các lượt đặt bàn khách đã hủy và còn được hoàn cọc, đang chờ nhân viên chuyển khoản thủ công.
                    </p>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã đặt bàn</th>
                                    <th>Khách hàng</th>
                                    <th>Số tiền hoàn</th>
                                    <th>Ngân hàng</th>
                                    <th>Số tài khoản</th>
                                    <th>Tên chủ TK</th>
                                    <th>Thời điểm hủy</th>
                                    <th className="admin-th-action">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hoanCocLoading ? (
                                    <tr><td colSpan={8} className="admin-state">Đang tải…</td></tr>
                                ) : hoanCocList.length === 0 ? (
                                    <tr><td colSpan={8} className="admin-state">Không có yêu cầu hoàn cọc nào đang chờ xử lý.</td></tr>
                                ) : (
                                    hoanCocList.map((datBan) => (
                                        <tr key={datBan.MaDatBan}>
                                            <td className="admin-mono">{datBan.MaDatBan}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{datBan.khach_hang?.HoTen ?? datBan.MaKhachHang}</div>
                                                {datBan.khach_hang?.SoDienThoai && (
                                                    <div style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>{datBan.khach_hang.SoDienThoai}</div>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#b45309' }}>{fmtMoney(datBan.SoTienHoan)}</td>
                                            <td>{datBan.NganHangHoanTien}</td>
                                            <td className="admin-mono">{datBan.SoTaiKhoanHoanTien}</td>
                                            <td>{datBan.TenChuTaiKhoanHoanTien}</td>
                                            <td className="admin-nowrap">{fmtDateTime(datBan.ThoiGianHuy)}</td>
                                            <td className="admin-th-action">
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn--primary admin-btn--sm"
                                                    disabled={dangXuLyHoanTien === datBan.MaDatBan}
                                                    onClick={() => handleDanhDauHoanTien(datBan)}
                                                >
                                                    {dangXuLyHoanTien === datBan.MaDatBan ? 'Đang lưu…' : 'Đánh dấu đã hoàn tiền'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {hoanCocPagination.last_page > 1 && (
                        <div className="admin-pagination">
                            <button
                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                disabled={hoanCocPagination.current_page <= 1}
                                onClick={() => setHoanCocPage((p) => Math.max(1, p - 1))}
                            >
                                ← Trước
                            </button>
                            <span className="admin-page-info">
                                Trang {hoanCocPagination.current_page} / {hoanCocPagination.last_page} · {hoanCocPagination.total} yêu cầu
                            </span>
                            <button
                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                disabled={hoanCocPagination.current_page >= hoanCocPagination.last_page}
                                onClick={() => setHoanCocPage((p) => p + 1)}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal xác nhận */}
            <Modal
                open={Boolean(xacNhanTarget)}
                title={`Xác nhận đặt bàn ${xacNhanTarget?.MaDatBan ?? ''}`}
                onClose={closeXacNhan}
                width={520}
                footer={
                    <>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={closeXacNhan} disabled={xacNhanSaving}>Hủy</button>
                        <button type="button" className="admin-btn admin-btn--primary" onClick={submitXacNhan} disabled={xacNhanSaving}>
                            {xacNhanSaving ? 'Đang lưu…' : 'Xác nhận'}
                        </button>
                    </>
                }
            >
                <p style={{ marginTop: 0, color: '#64748b', fontSize: 13 }}>
                    Chọn bàn phù hợp cho {xacNhanTarget?.SoLuongKhach} khách. Chỉ hiển thị bàn đang hoạt động và đủ sức chứa.
                </p>
                {banPhuHop.length === 0 ? (
                    <div className="admin-state">Không có bàn nào đủ sức chứa.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {banPhuHop.map((ban) => (
                            <label
                                key={ban.MaBan}
                                className="admin-input"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    borderColor: maBanChon === ban.MaBan ? '#4f46e5' : undefined,
                                }}
                            >
                                <input
                                    type="radio"
                                    name="ban-chon"
                                    value={ban.MaBan}
                                    checked={maBanChon === ban.MaBan}
                                    onChange={(e) => setMaBanChon(e.target.value)}
                                />
                                {ban.TenBan} · {ban.KhuVuc} ({ban.SucChua} khách)
                            </label>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Modal check-in */}
            <Modal
                open={Boolean(checkinTarget)}
                title={`Check-in đặt bàn ${checkinTarget?.MaDatBan ?? ''}`}
                onClose={closeCheckin}
                width={560}
                footer={
                    <>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={closeCheckin} disabled={checkinSaving}>Hủy</button>
                        <button type="button" className="admin-btn admin-btn--primary" onClick={submitCheckin} disabled={checkinSaving}>
                            {checkinSaving ? 'Đang mở hóa đơn…' : 'Check-in & mở hóa đơn'}
                        </button>
                    </>
                }
            >
                <p style={{ marginTop: 0, color: '#64748b', fontSize: 13 }}>
                    Bàn {checkinTarget?.ban_an?.TenBan} · {checkinTarget?.SoLuongKhach} khách. Chọn vé cho lượt phục vụ này.
                </p>
                {loaiVeList.length === 0 ? (
                    <div className="admin-state">Hiện chưa có loại vé áp dụng cho thời điểm này.</div>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {loaiVeList.map((lv) => (
                            <div key={lv.MaLoaiVe} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{lv.TenLoaiVe}</div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>{fmtMoney(lv.GiaVe)}</div>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    className="admin-input"
                                    style={{ width: 90 }}
                                    value={checkinCart[lv.MaLoaiVe] ?? 0}
                                    onChange={(e) => setSoLuongVe(lv.MaLoaiVe, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

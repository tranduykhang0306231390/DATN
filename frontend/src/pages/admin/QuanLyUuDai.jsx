// src/pages/admin/QuanLyUuDai.jsx
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../../assets/css/admin.css';
import uuDaiApi from '../../api/uuDaiApi';
import Modal from '../../components/admin/Modal';
import AdminDateInput from '../../components/admin/AdminDateInput';

const PER_PAGE = 10;

// Thứ tự áp dụng gắn liền với nhóm ưu đãi, KHÔNG cho nhập tay.
//
// Vì sao thứ tự này bảo vệ nhà hàng:
// Phần trăm được tính trên số tiền CÒN LẠI sau các lần giảm trước đó.
// Nên đưa các khoản giảm cố định (tặng món, giảm tiền) lên trước sẽ làm
// nhỏ đi phần gốc mà % áp lên, tổng giảm vì thế thấp hơn.
//
// Ví dụ hóa đơn 1.000.000đ, có voucher giảm 200.000đ và voucher giảm 20%:
//   Giảm % trước:   1.000.000 × 20% = 200.000 → còn 800.000 → −200.000 = 600.000
//   Giảm tiền trước: 1.000.000 − 200.000 = 800.000 → × 20% = 160.000 → còn 640.000
// Chênh lệch 40.000đ nghiêng về phía nhà hàng.
const NHOM_OPTIONS = [
    { value: 'TangMon',  label: 'Tặng món',  thuTu: 1, moTa: 'Trừ giá trị món tặng trước tiên' },
    { value: 'GiamTien', label: 'Giảm tiền', thuTu: 2, moTa: 'Trừ số tiền cố định' },
    { value: 'PhanTram', label: 'Giảm %',    thuTu: 3, moTa: 'Tính trên số tiền còn lại, áp dụng sau cùng' },
];

const nhomLabel = (v) => NHOM_OPTIONS.find((n) => n.value === v)?.label || v;
const nhomInfo  = (v) => NHOM_OPTIONS.find((n) => n.value === v) || NHOM_OPTIONS[1];
const thuTuTheoNhom = (v) => nhomInfo(v).thuTu;

const EMPTY_FORM = {
    TenUuDai: '',
    NhomUuDai: 'GiamTien',
    GiaTriHoaDonToiThieu: 0,
    GiaTriGiam: 0,
    SoDiemCanDoi: 0,
    SoLuongPhatHanh: 0,
    NgayBatDau: '',
    NgayKetThuc: '',
    MaHangThanhVien: '',
    ThuTuApDung: 1,
    CoTheDungChung: false,
    MoTa: '',
};

const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

// Ngày hôm nay theo giờ địa phương, dạng YYYY-MM-DD
const todayStr = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
};

export default function QuanLyUuDai() {
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [hangOptions, setHangOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [search, setSearch] = useState('');
    const [trangThai, setTrangThai] = useState('');
    const [nhom, setNhom] = useState('');
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // MaUuDai đang sửa, null = thêm mới
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadList = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        uuDaiApi
            .getAll({ search, trang_thai: trangThai, nhom, page, per_page: PER_PAGE })
            .then((res) => {
                if (res.data?.success) {
                    setList(res.data.data);
                    setPagination(res.data.pagination);
                }
            })
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [search, trangThai, nhom, page]);

    useEffect(() => {
        uuDaiApi
            .getOptions()
            .then((res) => {
                if (res.data?.success) setHangOptions(res.data.data.hangThanhVien || []);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void loadList(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadList]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (ud) => {
        setEditing(ud.MaUuDai);
        setForm({
            TenUuDai: ud.TenUuDai ?? '',
            NhomUuDai: ud.NhomUuDai ?? 'GiamTien',
            GiaTriHoaDonToiThieu: Number(ud.GiaTriHoaDonToiThieu) || 0,
            GiaTriGiam: Number(ud.GiaTriGiam) || 0,
            SoDiemCanDoi: Number(ud.SoDiemCanDoi) || 0,
            SoLuongPhatHanh: Number(ud.SoLuongPhatHanh) || 0,
            NgayBatDau: (ud.NgayBatDau || '').slice(0, 10),
            NgayKetThuc: (ud.NgayKetThuc || '').slice(0, 10),
            MaHangThanhVien: ud.MaHangThanhVien ?? '',
            ThuTuApDung: Number(ud.ThuTuApDung) || 1,
            CoTheDungChung: !!ud.CoTheDungChung,
            MoTa: ud.MoTa ?? '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const setField = (key, value) =>
        setForm((f) => ({
            ...f,
            [key]: value,
            // Đổi nhóm ưu đãi thì thứ tự áp dụng tự đổi theo
            ...(key === 'NhomUuDai' ? { ThuTuApDung: thuTuTheoNhom(value) } : {}),
        }));

    const handleSubmit = async () => {
        // Khi thêm mới: không cho phép ngày bắt đầu / kết thúc nằm trong quá khứ
        if (!editing) {
            const today = todayStr();
            if (form.NgayBatDau && form.NgayBatDau < today) {
                setFormError('Ngày bắt đầu không được nằm trong quá khứ.');
                return;
            }
            if (form.NgayKetThuc && form.NgayKetThuc < today) {
                setFormError('Ngày kết thúc không được nằm trong quá khứ.');
                return;
            }
        }

        setSaving(true);
        setFormError('');
        const payload = {
            ...form,
            GiaTriGiam: Number(form.GiaTriGiam),
            SoDiemCanDoi: Number(form.SoDiemCanDoi),
            SoLuongPhatHanh: Number(form.SoLuongPhatHanh),
            ThuTuApDung: thuTuTheoNhom(form.NhomUuDai),
            GiaTriHoaDonToiThieu: Number(form.GiaTriHoaDonToiThieu) || 0,
            MaHangThanhVien: form.MaHangThanhVien || null,
        };
        try {
            if (editing) {
                await uuDaiApi.update(editing, payload);
            } else {
                await uuDaiApi.create(payload);
                setPage(1);
            }
            setModalOpen(false);
            loadList();
        } catch (err) {
            const res = err.response?.data;
            const firstErr = res?.errors ? Object.values(res.errors)[0]?.[0] : null;
            setFormError(firstErr || res?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (ud) => {
        const dangHoatDong = ud.TrangThai === 'HoatDong';
        const confirm = await Swal.fire({
            title: `${dangHoatDong ? 'Ngừng' : 'Kích hoạt'} ưu đãi ${ud.MaUuDai}?`,
            text: `Ưu đãi "${ud.TenUuDai}" sẽ được ${dangHoatDong ? 'ngừng áp dụng' : 'kích hoạt lại'}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Không',
            confirmButtonColor: dangHoatDong ? '#dc2626' : '#4f46e5',
        });
        if (!confirm.isConfirmed) return;
        try {
            await uuDaiApi.toggleTrangThai(ud.MaUuDai);
            Swal.fire({
                icon: 'success',
                title: dangHoatDong ? 'Đã ngừng ưu đãi' : 'Đã kích hoạt ưu đãi',
                timer: 1500,
                showConfirmButton: false,
            });
            loadList();
        } catch (e) {
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể đổi trạng thái', 'error');
        }
    };

    const applyFilter = () => setPage(1);

    const goToPage = (p) => {
        if (p < 1 || p > pagination.last_page || p === pagination.current_page) return;
        setPage(p);
    };

    return (
        <div className="admin-page">
            <header className="admin-hero admin-hero--compact">
                <div className="admin-hero-text">
                    <span className="admin-hero-eyebrow">Ưu đãi &amp; Voucher</span>
                    <h2 className="admin-hero-title">Quản lý ưu đãi</h2>
                </div>
                <div className="admin-hero-actions">
                    <button type="button" className="admin-btn admin-btn--light" onClick={openCreate}>
                        + Thêm ưu đãi
                    </button>
                </div>
            </header>

            {/* Thanh công cụ lọc */}
            <div className="admin-toolbar">
                <input
                    className="admin-input"
                    placeholder="Tìm theo tên hoặc mã…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                />
                <select className="admin-select" value={nhom} onChange={(e) => setNhom(e.target.value)}>
                    <option value="">Tất cả nhóm</option>
                    {NHOM_OPTIONS.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                </select>
                <select
                    className="admin-select"
                    value={trangThai}
                    onChange={(e) => setTrangThai(e.target.value)}
                >
                    <option value="">Mọi trạng thái</option>
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="NgungApDung">Đã ngừng</option>
                </select>
                <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilter}>
                    Lọc
                </button>
            </div>

            {/* Bảng */}
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên ưu đãi</th>
                            <th>Nhóm</th>
                            <th>Giá trị giảm</th>
                            <th>Điểm đổi</th>
                            <th>Tồn / Phát hành</th>
                            <th>Áp dụng hạng</th>
                            <th>Hiệu lực</th>
                            <th>Trạng thái</th>
                            <th className="admin-th-action">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={10} className="admin-state">Đang tải…</td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="admin-state">Chưa có ưu đãi nào.</td>
                            </tr>
                        ) : (
                            list.map((ud) => (
                                <tr key={ud.MaUuDai}>
                                    <td className="admin-mono">{ud.MaUuDai}</td>
                                    <td>{ud.TenUuDai}</td>
                                    <td>{nhomLabel(ud.NhomUuDai)}</td>
                                    <td>
                                        {ud.NhomUuDai === 'PhanTram'
                                            ? `${ud.GiaTriGiam}%`
                                            : fmtMoney(ud.GiaTriGiam)}
                                    </td>
                                    <td>{ud.SoDiemCanDoi}</td>
                                    <td>
                                        {ud.SoLuongTon} / {ud.SoLuongPhatHanh}
                                    </td>
                                    <td>
                                        {ud.MaHangThanhVien
                                            ? (hangOptions.find((h) => h.MaHangThanhVien === ud.MaHangThanhVien)?.TenHang || ud.MaHangThanhVien)
                                            : 'Mọi hạng'}
                                    </td>
                                    <td className="admin-nowrap">
                                        {(ud.NgayBatDau || '').slice(0, 10)}<br />
                                        {(ud.NgayKetThuc || '').slice(0, 10)}
                                    </td>
                                    <td>
                                        <span
                                            className={`admin-badge ${ud.TrangThai === 'HoatDong' ? 'admin-badge--on' : 'admin-badge--off'}`}
                                        >
                                            {ud.TrangThai === 'HoatDong' ? 'Đang chạy' : 'Đã ngừng'}
                                        </span>
                                    </td>
                                    <td className="admin-th-action">
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ghost admin-btn--sm"
                                                onClick={() => openEdit(ud)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-btn admin-btn--sm ${ud.TrangThai === 'HoatDong' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                                                onClick={() => handleToggle(ud)}
                                            >
                                                {ud.TrangThai === 'HoatDong' ? 'Ngừng' : 'Mở'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang: hiện khi có nhiều hơn 10 ưu đãi */}
            {pagination.last_page > 1 && (
                <div className="admin-pagination">
                    <button
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={pagination.current_page <= 1}
                        onClick={() => goToPage(pagination.current_page - 1)}
                    >
                        ← Trước
                    </button>

                    <div className="admin-page-numbers">
                        {pageList.map((p, i) =>
                            p === '…' ? (
                                <span key={`dots-${i}`} className="admin-page-dots">…</span>
                            ) : (
                                <button
                                    key={p}
                                    className={`admin-btn admin-btn--sm ${p === pagination.current_page ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                                    onClick={() => goToPage(p)}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={pagination.current_page >= pagination.last_page}
                        onClick={() => goToPage(pagination.current_page + 1)}
                    >
                        Sau →
                    </button>

                    <span className="admin-page-info">
                        {pagination.total} ưu đãi
                    </span>
                </div>
            )}

            {/* Modal thêm / sửa */}
            <Modal
                open={modalOpen}
                title={editing ? `Sửa ưu đãi ${editing}` : 'Thêm ưu đãi mới'}
                onClose={() => setModalOpen(false)}
                width={620}
                footer={
                    <>
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </>
                }
            >
                {formError && <div className="admin-form-error">{formError}</div>}

                <div className="admin-form">
                    <div className="admin-field admin-field--full">
                        <label>Tên ưu đãi</label>
                        <input
                            className="admin-input"
                            value={form.TenUuDai}
                            onChange={(e) => setField('TenUuDai', e.target.value)}
                            placeholder="VD: Giảm 50.000đ"
                        />
                    </div>

                    <div className="admin-field">
                        <label>Nhóm ưu đãi</label>
                        <select
                            className="admin-select"
                            value={form.NhomUuDai}
                            onChange={(e) => setField('NhomUuDai', e.target.value)}
                        >
                            {NHOM_OPTIONS.map((n) => (
                                <option key={n.value} value={n.value}>{n.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>
                            {form.NhomUuDai === 'PhanTram' ? 'Phần trăm giảm (%)' : 'Giá trị giảm (đ)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.GiaTriGiam}
                            onChange={(e) => setField('GiaTriGiam', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Hóa đơn tối thiểu (đ){' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>(0 = không giới hạn)</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.GiaTriHoaDonToiThieu}
                            onChange={(e) => setField('GiaTriHoaDonToiThieu', e.target.value)}
                        />
                        
                    </div>

                    <div className="admin-field">
                        <label>Điểm cần để đổi</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.SoDiemCanDoi}
                            onChange={(e) => setField('SoDiemCanDoi', e.target.value)}
                        />
                    </div>

                    

                    <div className="admin-field">
                        <label>Ngày bắt đầu</label>
                        <AdminDateInput
                            value={form.NgayBatDau}
                            min={editing ? undefined : todayStr()}
                            max={form.NgayKetThuc || undefined}
                            onChange={(v) => setField('NgayBatDau', v)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Ngày kết thúc</label>
                        <AdminDateInput
                            value={form.NgayKetThuc}
                            min={form.NgayBatDau || (editing ? undefined : todayStr())}
                            onChange={(v) => setField('NgayKetThuc', v)}
                        />
                    </div>
                    <div className="admin-field">
                        <label>Số lượng phát hành</label>
                        <input
                            type="number"
                            min="0"
                            className="admin-input"
                            value={form.SoLuongPhatHanh}
                            onChange={(e) => setField('SoLuongPhatHanh', e.target.value)}
                        />
                    </div>

                    <div className="admin-field">
                        <label>Áp dụng cho hạng</label>
                        <select
                            className="admin-select"
                            value={form.MaHangThanhVien}
                            onChange={(e) => setField('MaHangThanhVien', e.target.value)}
                        >
                            <option value="">Mọi hạng</option>
                            {hangOptions.map((h) => (
                                <option key={h.MaHangThanhVien} value={h.MaHangThanhVien}>
                                    {h.TenHang}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-field">
                        <label>
                            Thứ tự áp dụng{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>(tự động)</span>
                        </label>
                        <input
                            type="text"
                            className="admin-input"
                            value={`${thuTuTheoNhom(form.NhomUuDai)} — ${nhomLabel(form.NhomUuDai)}`}
                            readOnly
                            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                        />
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {nhomInfo(form.NhomUuDai).moTa}
                        </span>
                    </div>

                    <div className="admin-field admin-field--full">
                        <div
                            style={{
                                fontSize: 12,
                                color: '#475569',
                                background: '#f5f6fb',
                                borderRadius: 10,
                                padding: '10px 14px',
                                lineHeight: 1.6,
                            }}
                        >
                            <b>Thứ tự áp dụng do hệ thống quyết định</b> 
                            <b> 1. Tặng món → 2. Giảm tiền → 3. Giảm %</b>.
                            
                        </div>
                    </div>

                    <div className="admin-field admin-field--full">
                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                checked={form.CoTheDungChung}
                                onChange={(e) => setField('CoTheDungChung', e.target.checked)}
                            />
                            Có thể dùng chung với ưu đãi khác cùng nhóm
                        </label>
                    </div>

                    <div className="admin-field admin-field--full">
                        <label>Mô tả</label>
                        <textarea
                            className="admin-input"
                            rows={2}
                            value={form.MoTa}
                            onChange={(e) => setField('MoTa', e.target.value)}
                            placeholder="Mô tả ngắn về ưu đãi"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}


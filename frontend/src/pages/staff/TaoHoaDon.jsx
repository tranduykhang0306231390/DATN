// src/pages/staff/TaoHoaDon.jsx
// Luồng: Mở bàn -> Gọi thêm / Đổi bàn / Hủy bàn
// -> Tra cứu thành viên + voucher -> Ước tính -> Thanh toán

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';

import hoaDonApi from '../../api/hoaDonApi';

import {
    BUOI_LABEL,
    fmt,
    NGAY_LABEL,
    NHOM_LABEL,
    PageTitle,
} from '../../components/staff/StaffComponents';

import {
    box,
    btnCell,
    btnClose,
    btnGrid,
    btnPay,
    dot,
    mBody,
    mClose,
    mFoot,
    mHead,
    noteDuVoucher,
    ovl,
    pointBox,
    pointBoxGray,
    sumBox,
    sumRow,
} from './taoHoaDonStyles';

import '../../assets/css/staff.css';

const TONG_SO_BAN = 20;

const getInvoiceDetails = (invoice) => {
    const details =
        invoice?.chi_tiet_hoa_don
        ?? invoice?.chiTietHoaDon
        ?? [];

    return Array.isArray(details)
        ? details
        : [];
};

const getTicketName = (detail) => (
    detail?.loai_ve?.TenLoaiVe
    ?? detail?.loaiVe?.TenLoaiVe
    ?? detail?.MaLoaiVe
    ?? 'Không xác định'
);

const formatDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(
        String(value).replace(' ', 'T')
    );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('vi-VN');
};

const getVoucherOffer = (voucher) => (
    voucher?.uu_dai
    ?? voucher?.uuDai
    ?? voucher
);

export default function TaoHoaDon() {
    const [loaiVeList, setLoaiVeList] =
        useState([]);

    const [banTreo, setBanTreo] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    /*
    |--------------------------------------------------------------------------
    | Trạng thái bàn và hóa đơn
    |--------------------------------------------------------------------------
    |
    | mode:
    | - null: chưa chọn bàn
    | - moBan: đang tạo hóa đơn cho bàn trống
    | - xemBan: đang xem bàn phục vụ
    |
    */

    const [mode, setMode] =
        useState(null);

    const [soBan, setSoBan] =
        useState(null);

    const [bill, setBill] =
        useState(null);

    const [cart, setCart] =
        useState({});

    const [dangGoiThem, setDangGoiThem] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Thanh toán
    |--------------------------------------------------------------------------
    */

    const [payOpen, setPayOpen] =
        useState(false);

    const [sdt, setSdt] =
        useState('');

    const [khachHang, setKhachHang] =
        useState(null);

    const [vouchers, setVouchers] =
        useState([]);

    const [selected, setSelected] =
        useState([]);

    const [sdtLoading, setSdtLoading] =
        useState(false);

    const [sdtError, setSdtError] =
        useState('');

    const [uoc, setUoc] =
        useState(null);

    const [uocLoading, setUocLoading] =
        useState(false);

    /*
     * Chặn bấm gửi nhiều request liên tiếp.
     */
    const operationRef = useRef(false);

    const banTreoMap = banTreo.reduce(
        (result, hoaDon) => {
            result[String(hoaDon.SoBan)] =
                hoaDon;

            return result;
        },
        {}
    );

    /*
    |--------------------------------------------------------------------------
    | Tải dữ liệu
    |--------------------------------------------------------------------------
    */

    const loadBanTreo = useCallback(async () => {
        try {
            const response =
                await hoaDonApi.banDangTreo();

            const list =
                response.data?.data ?? [];

            const normalizedList =
                Array.isArray(list)
                    ? list
                    : [];

            setBanTreo(normalizedList);

            return normalizedList;
        } catch {
            setBanTreo([]);
            return [];
        }
    }, []);

    const loadLoaiVe = useCallback(async () => {
        try {
            const response =
                await hoaDonApi.getLoaiVe();

            const list =
                response.data?.data ?? [];

            setLoaiVeList(
                Array.isArray(list)
                    ? list
                    : []
            );
        } catch {
            setLoaiVeList([]);
            setError(
                'Không tải được danh sách vé.'
            );
        }
    }, []);

    useEffect(() => {
        void loadLoaiVe();
        void loadBanTreo();
    }, [
        loadBanTreo,
        loadLoaiVe,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Chọn và đóng bàn
    |--------------------------------------------------------------------------
    */

    const chonBan = (number) => {
        const hoaDon =
            banTreoMap[String(number)];

        setCart({});
        setDangGoiThem(false);
        setError('');

        if (hoaDon) {
            setBill(hoaDon);
            setSoBan(null);
            setMode('xemBan');

            return;
        }

        void loadLoaiVe();

        setSoBan(number);
        setBill(null);
        setMode('moBan');
    };

    const resetPayment = () => {
        setPayOpen(false);
        setSdt('');
        setKhachHang(null);
        setVouchers([]);
        setSelected([]);
        setSdtError('');
        setUoc(null);
        setUocLoading(false);
    };

    const dong = () => {
        setMode(null);
        setSoBan(null);
        setBill(null);
        setCart({});
        setDangGoiThem(false);
        setError('');
    };

    /*
    |--------------------------------------------------------------------------
    | Giỏ vé
    |--------------------------------------------------------------------------
    */

    const setQty = (maLoaiVe, delta) => {
        setCart((currentCart) => {
            const currentQuantity =
                Number(
                    currentCart[maLoaiVe] ?? 0
                );

            const nextQuantity =
                currentQuantity + delta;

            if (nextQuantity <= 0) {
                const nextCart = {
                    ...currentCart,
                };

                delete nextCart[maLoaiVe];

                return nextCart;
            }

            /*
             * Đồng bộ với giới hạn backend.
             */
            if (nextQuantity > 100) {
                return currentCart;
            }

            return {
                ...currentCart,
                [maLoaiVe]: nextQuantity,
            };
        });
    };

    const cartItems = loaiVeList
        .filter(
            (ticket) =>
                Number(cart[ticket.MaLoaiVe]) > 0
        )
        .map((ticket) => {
            const quantity =
                Number(
                    cart[ticket.MaLoaiVe]
                );

            const price =
                Number(ticket.GiaVe ?? 0);

            return {
                ...ticket,
                SoLuong: quantity,
                ThanhTien:
                    price * quantity,
            };
        });

    const tongCart = cartItems.reduce(
        (total, item) =>
            total
            + Number(item.ThanhTien ?? 0),
        0
    );

    const createDetailPayload = () => ({
        chi_tiet: cartItems.map((item) => ({
            MaLoaiVe: item.MaLoaiVe,
            SoLuong: item.SoLuong,
        })),
    });

    /*
    |--------------------------------------------------------------------------
    | 1. Mở bàn
    |--------------------------------------------------------------------------
    */

    const handleMoBan = async () => {
        if (operationRef.current) {
            return;
        }

        if (!soBan) {
            setError('Vui lòng chọn bàn.');
            return;
        }

        if (cartItems.length === 0) {
            setError(
                'Vui lòng chọn ít nhất một vé.'
            );

            return;
        }

        operationRef.current = true;
        setLoading(true);
        setError('');

        try {
            const response =
                await hoaDonApi.moBan({
                    so_ban: soBan,
                    ...createDetailPayload(),
                });

            await Swal.fire({
                icon: 'success',
                title:
                    response.data?.message
                    ?? `Đã mở bàn ${soBan}`,
                timer: 1400,
                showConfirmButton: false,
            });

            await loadBanTreo();
            dong();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                ?? 'Không mở được bàn.'
            );
        } finally {
            operationRef.current = false;
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | 2. Gọi thêm
    |--------------------------------------------------------------------------
    */

    const handleThemMon = async () => {
        if (
            operationRef.current
            || !bill
        ) {
            return;
        }

        if (cartItems.length === 0) {
            setError(
                'Vui lòng chọn vé muốn thêm.'
            );

            return;
        }

        operationRef.current = true;
        setLoading(true);
        setError('');

        try {
            const response =
                await hoaDonApi.themMon(
                    bill.MaHoaDon,
                    createDetailPayload()
                );

            await Swal.fire({
                icon: 'success',
                title:
                    response.data?.message
                    ?? 'Đã thêm vào bàn',
                timer: 1400,
                showConfirmButton: false,
            });

            const list =
                await loadBanTreo();

            const updatedBill = list.find(
                (invoice) =>
                    invoice.MaHoaDon
                    === bill.MaHoaDon
            );

            if (updatedBill) {
                setBill(updatedBill);
            } else {
                dong();
            }

            setCart({});
            setDangGoiThem(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                ?? 'Không thêm được vé.'
            );
        } finally {
            operationRef.current = false;
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | 3. Đổi bàn
    |--------------------------------------------------------------------------
    */

    const handleDoiBan = async () => {
        if (
            operationRef.current
            || !bill
        ) {
            return;
        }

        const emptyTables = Array.from(
            {
                length: TONG_SO_BAN,
            },
            (_, index) => index + 1
        ).filter(
            (number) =>
                !banTreoMap[String(number)]
        );

        if (emptyTables.length === 0) {
            await Swal.fire({
                icon: 'info',
                title: 'Không còn bàn trống',
                text:
                    'Tất cả các bàn đang có khách.',
            });

            return;
        }

        const html = `
            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:8px;
                    margin-top:4px;
                "
            >
                ${emptyTables.map((number) => `
                    <button
                        type="button"
                        class="swal-pick-ban"
                        data-ban="${number}"
                        style="
                            padding:14px 4px;
                            border-radius:10px;
                            border:1px solid #bbf7d0;
                            background:#dcfce7;
                            color:#15803d;
                            font-weight:700;
                            font-size:14px;
                            cursor:pointer;
                            font-family:inherit;
                        "
                    >
                        Bàn ${number}
                    </button>
                `).join('')}
            </div>
        `;

        const selectedTable =
            await new Promise((resolve) => {
                let pickedTable = null;

                Swal.fire({
                    title:
                        `Chuyển bàn ${bill.SoBan} sang bàn nào?`,
                    html,
                    width: 420,
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: 'Hủy',

                    didOpen: () => {
                        document
                            .querySelectorAll(
                                '.swal-pick-ban'
                            )
                            .forEach((button) => {
                                button.addEventListener(
                                    'mouseenter',
                                    () => {
                                        button.style.background =
                                            '#16a34a';

                                        button.style.color =
                                            '#ffffff';
                                    }
                                );

                                button.addEventListener(
                                    'mouseleave',
                                    () => {
                                        button.style.background =
                                            '#dcfce7';

                                        button.style.color =
                                            '#15803d';
                                    }
                                );

                                button.addEventListener(
                                    'click',
                                    () => {
                                        pickedTable =
                                            Number(
                                                button.dataset.ban
                                            );

                                        Swal.close();
                                    }
                                );
                            });
                    },

                    willClose: () => {
                        resolve(pickedTable);
                    },
                });
            });

        if (!selectedTable) {
            return;
        }

        operationRef.current = true;
        setLoading(true);

        try {
            const response =
                await hoaDonApi.doiBan(
                    bill.MaHoaDon,
                    Number(selectedTable)
                );

            await Swal.fire({
                icon: 'success',
                title:
                    response.data?.message
                    ?? 'Đã đổi bàn',
                timer: 1600,
                showConfirmButton: false,
            });

            const list =
                await loadBanTreo();

            const updatedBill = list.find(
                (invoice) =>
                    invoice.MaHoaDon
                    === bill.MaHoaDon
            );

            if (updatedBill) {
                setBill(updatedBill);
            } else {
                dong();
            }
        } catch (requestError) {
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text:
                    requestError.response?.data?.message
                    ?? 'Không đổi được bàn.',
            });
        } finally {
            operationRef.current = false;
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | 4. Hủy bàn
    |--------------------------------------------------------------------------
    */

    const handleHuyBan = async () => {
        if (
            operationRef.current
            || !bill
        ) {
            return;
        }

        const confirmation = await Swal.fire({
            title: `Hủy bàn ${bill.SoBan}?`,
            text:
                'Hóa đơn sẽ bị hủy và bàn được giải phóng. Khách không được tích điểm.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hủy',
            cancelButtonText: 'Không',
            confirmButtonColor: '#dc2626',
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        operationRef.current = true;
        setLoading(true);

        try {
            const response =
                await hoaDonApi.huyBan(
                    bill.MaHoaDon
                );

            await Swal.fire({
                icon: 'success',
                title:
                    response.data?.message
                    ?? 'Đã hủy bàn',
                timer: 1400,
                showConfirmButton: false,
            });

            await loadBanTreo();
            dong();
        } catch (requestError) {
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text:
                    requestError.response?.data?.message
                    ?? 'Không hủy được bàn.',
            });
        } finally {
            operationRef.current = false;
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | 5. Mở cửa sổ thanh toán
    |--------------------------------------------------------------------------
    */

    const moThanhToan = () => {
        setSdt('');
        setKhachHang(null);
        setVouchers([]);
        setSelected([]);
        setSdtError('');
        setUoc(null);
        setPayOpen(true);
    };

    const closePayment = () => {
        if (
            loading
            || operationRef.current
        ) {
            return;
        }

        resetPayment();
    };

    /*
    |--------------------------------------------------------------------------
    | Tra cứu khách hàng
    |--------------------------------------------------------------------------
    */

    const handleLookup = async () => {
        if (sdtLoading) {
            return;
        }

        const phone = sdt.trim();

        setSdtError('');
        setKhachHang(null);
        setVouchers([]);
        setSelected([]);
        setUoc(null);

        if (!phone) {
            setSdtError(
                'Vui lòng nhập số điện thoại.'
            );

            return;
        }

        setSdtLoading(true);

        try {
            const response =
                await hoaDonApi.lookupKhachHang(
                    phone
                );

            if (response.data?.success) {
                setKhachHang(
                    response.data?.khachHang
                    ?? response.data?.data?.khachHang
                    ?? null
                );

                const voucherList =
                    response.data?.vouchers
                    ?? response.data?.data?.vouchers
                    ?? [];

                setVouchers(
                    Array.isArray(voucherList)
                        ? voucherList
                        : []
                );
            }
        } catch (requestError) {
            setSdtError(
                requestError.response?.data?.message
                ?? 'Không tìm thấy khách hàng.'
            );
        } finally {
            setSdtLoading(false);
        }
    };

    const removeCustomer = () => {
        setKhachHang(null);
        setVouchers([]);
        setSelected([]);
        setSdt('');
        setSdtError('');
        setUoc(null);
    };

    const toggleVoucher = (voucherId) => {
        setSelected((currentSelected) => {
            if (
                currentSelected.includes(voucherId)
            ) {
                return currentSelected.filter(
                    (id) => id !== voucherId
                );
            }

            return [
                ...currentSelected,
                voucherId,
            ];
        });
    };

    const billDetails =
        getInvoiceDetails(bill);

    const tongBill = billDetails.reduce(
        (total, detail) =>
            total
            + Number(detail.DonGia ?? 0)
            * Number(detail.SoLuong ?? 0),
        0
    );

    /*
    |--------------------------------------------------------------------------
    | Ước tính hóa đơn
    |--------------------------------------------------------------------------
    |
    | Server dùng chung nghiệp vụ với thanh toán thật nên số tiền,
    | voucher và điểm dự kiến phải được lấy từ API.
    |
    */

    useEffect(() => {
        if (
            !payOpen
            || !bill?.MaHoaDon
        ) {
            return undefined;
        }

        let cancelled = false;

        setUocLoading(true);

        hoaDonApi.uocTinh(
            bill.MaHoaDon,
            {
                ma_khach_hang:
                    khachHang?.MaKhachHang
                    ?? null,

                vouchers_ap_dung:
                    selected,
            }
        )
            .then((response) => {
                if (
                    !cancelled
                    && response.data?.success
                ) {
                    setUoc(
                        response.data?.data
                        ?? null
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setUoc(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setUocLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        bill?.MaHoaDon,
        khachHang?.MaKhachHang,
        payOpen,
        selected,
    ]);

    const tongThanhToanUocTinh =
        Number(
            uoc?.TongThanhToan
            ?? tongBill
        );

    const soVoucherApDung =
        Number(
            uoc?.SoVoucherApDung
            ?? 0
        );

    const hetTien =
        Boolean(uoc)
        && tongThanhToanUocTinh <= 0
        && selected.length > 0;

    const duVoucher =
        Boolean(uoc)
        && selected.length
            > soVoucherApDung;

    const voucherKhongApDung =
        Array.isArray(
            uoc?.VoucherKhongApDung
        )
            ? uoc.VoucherKhongApDung
            : [];

    /*
    |--------------------------------------------------------------------------
    | 6. Thanh toán
    |--------------------------------------------------------------------------
    */

    const handleThanhToan = async () => {
        if (
            !bill
            || operationRef.current
            || uocLoading
        ) {
            return;
        }

        const confirmation = await Swal.fire({
            title:
                `Thanh toán bàn ${bill.SoBan}?`,
            text:
                'Hóa đơn sẽ được chốt, voucher được sử dụng và điểm được cộng cho khách hàng.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Thanh toán',
            cancelButtonText: 'Kiểm tra lại',
            confirmButtonColor: '#16a34a',
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        operationRef.current = true;
        setLoading(true);

        const paymentPayload = {
            ma_khach_hang:
                khachHang?.MaKhachHang
                ?? null,

            vouchers_ap_dung:
                selected,
        };

        try {
            let response;

            try {
                response =
                    await hoaDonApi.thanhToan(
                        bill.MaHoaDon,
                        paymentPayload
                    );
            } catch (requestError) {
                if (
                    requestError.response?.data?.code
                    !== 'VOUCHERS_INVALID'
                ) {
                    throw requestError;
                }

                const invalidVoucherIds =
                    requestError.response?.data
                        ?.invalid_vouchers
                    ?? [];

                const retryConfirmation =
                    await Swal.fire({
                        title:
                            'Một số voucher không thể áp dụng',
                        html:
                            `${
                                requestError.response?.data?.message
                                ?? 'Voucher không còn đủ điều kiện.'
                            }`
                            + (
                                invalidVoucherIds.length > 0
                                    ? `<br><br>Mã voucher: <b>${invalidVoucherIds.join(', ')}</b>`
                                    : ''
                            )
                            + '<br><br>Các voucher bị bỏ qua sẽ không bị mất.',

                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText:
                            'Bỏ qua và thanh toán',
                        cancelButtonText:
                            'Chưa thanh toán',
                        confirmButtonColor:
                            '#dc2626',
                    });

                if (
                    !retryConfirmation.isConfirmed
                ) {
                    return;
                }

                response =
                    await hoaDonApi.thanhToan(
                        bill.MaHoaDon,
                        {
                            ...paymentPayload,

                            continue_without_invalid_vouchers:
                                true,
                        }
                    );
            }

            const result =
                response.data?.data
                ?? {};

            resetPayment();
            await loadBanTreo();
            dong();

            await Swal.fire({
                icon: 'success',
                title: 'Thanh toán thành công',

                html:
                    `Hóa đơn <b>${
                        result.MaHoaDon
                        ?? bill.MaHoaDon
                    }</b>`
                    + `<br>Tổng thu: <b>${
                        fmt(
                            result.TongThanhToan
                            ?? 0
                        )
                    }</b>`
                    + (
                        Number(
                            result.TongGiam
                            ?? 0
                        ) > 0
                            ? `<br>Đã giảm: ${
                                fmt(
                                    result.TongGiam
                                )
                            }`
                            : ''
                    )
                    + (
                        Number(
                            result.DiemTichLuy
                            ?? 0
                        ) > 0
                            ? `<br>Điểm tích lũy: <b>+${
                                result.DiemTichLuy
                            }</b>`
                            : ''
                    ),

                timer: 2500,
                showConfirmButton: false,
            });
        } catch (requestError) {
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text:
                    requestError.response?.data?.message
                    ?? 'Không thanh toán được.',
            });
        } finally {
            operationRef.current = false;
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Nhóm vé theo buổi
    |--------------------------------------------------------------------------
    */

    const grouped = loaiVeList.reduce(
        (result, ticket) => {
            const key =
                ticket.BuoiAn
                ?? 'Khac';

            if (!result[key]) {
                result[key] = [];
            }

            result[key].push(ticket);

            return result;
        },
        {}
    );

    /*
    |--------------------------------------------------------------------------
    | Khối chọn vé dùng chung
    |--------------------------------------------------------------------------
    */

    const KhoiChonVe = ({ title }) => (
        <div className="staff-card">
            <h3
                style={{
                    margin: '0 0 16px',
                    fontSize: 16,
                    fontWeight: 600,
                }}
            >
                {title}
            </h3>

            {Object.keys(grouped).length === 0 ? (
                <div className="alert-info">
                    Không có vé nào áp dụng cho thời điểm hiện tại.
                </div>
            ) : (
                Object.entries(grouped).map(
                    ([buoi, tickets]) => (
                        <div
                            key={buoi}
                            style={{
                                marginBottom: 20,
                            }}
                        >
                            <div className="buoi-label">
                                {BUOI_LABEL[buoi]
                                    ?? buoi}
                            </div>

                            {tickets.map((ticket) => (
                                <div
                                    key={
                                        ticket.MaLoaiVe
                                    }
                                    className="ve-row"
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <div className="ve-name">
                                            {ticket.TenLoaiVe}
                                        </div>

                                        <div className="ve-meta">
                                            {NGAY_LABEL[
                                                ticket.LoaiNgay
                                            ]
                                                ?? ticket.LoaiNgay}

                                            {' · '}

                                            {fmt(
                                                ticket.GiaVe
                                            )}
                                            /vé
                                        </div>
                                    </div>

                                    <div className="qty-control">
                                        <button
                                            type="button"
                                            className="qty-btn"
                                            onClick={() =>
                                                setQty(
                                                    ticket.MaLoaiVe,
                                                    -1
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span className="qty-num">
                                            {cart[
                                                ticket.MaLoaiVe
                                            ] ?? 0}
                                        </span>

                                        <button
                                            type="button"
                                            className="qty-btn"
                                            onClick={() =>
                                                setQty(
                                                    ticket.MaLoaiVe,
                                                    1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )
            )}
        </div>
    );

    return (
        <div className="staff-page">
            <PageTitle>
                🧾 Quản lý bàn &amp; hóa đơn
            </PageTitle>

            {/* Sơ đồ bàn */}
            <div
                className="staff-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <h3
                    style={{
                        margin: '0 0 4px',
                        fontSize: 16,
                        fontWeight: 600,
                    }}
                >
                    Sơ đồ bàn
                </h3>

                <div
                    style={{
                        marginBottom: 14,
                        color: '#6b7280',
                        fontSize: 13,
                    }}
                >
                    <span
                        style={dot(
                            '#dcfce7',
                            '#16a34a'
                        )}
                    />
                    {' '}
                    Trống
                    {'  '}

                    <span
                        style={{
                            marginLeft: 16,
                            ...dot(
                                '#fee2e2',
                                '#dc2626'
                            ),
                        }}
                    />
                    {' '}
                    Đang phục vụ
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(78px, 1fr))',
                        gap: 10,
                    }}
                >
                    {Array.from(
                        {
                            length: TONG_SO_BAN,
                        },
                        (_, index) => index + 1
                    ).map((number) => {
                        const invoice =
                            banTreoMap[
                                String(number)
                            ];

                        const active =
                            soBan === number
                            || Number(
                                bill?.SoBan
                            ) === number;

                        return (
                            <button
                                key={number}
                                type="button"
                                onClick={() =>
                                    chonBan(number)
                                }
                                style={{
                                    padding:
                                        '14px 8px',

                                    borderRadius: 10,

                                    border:
                                        active
                                            ? '2px solid #111827'
                                            : '1px solid transparent',

                                    background:
                                        invoice
                                            ? '#fee2e2'
                                            : '#dcfce7',

                                    color:
                                        invoice
                                            ? '#b91c1c'
                                            : '#15803d',

                                    cursor: 'pointer',
                                    fontFamily:
                                        'inherit',
                                    fontSize: 15,
                                    fontWeight: 700,
                                }}
                            >
                                Bàn {number}

                                <div
                                    style={{
                                        marginTop: 2,
                                        fontSize: 10,
                                        fontWeight: 500,
                                    }}
                                >
                                    {invoice
                                        ? 'Đang phục vụ'
                                        : 'Trống'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mở bàn */}
            {mode === 'moBan' && (
                <div className="tao-hd-layout">
                    <div className="tao-hd-left">
                        <KhoiChonVe
                            title={
                                `Chọn vé cho bàn ${soBan}`
                            }
                        />
                    </div>

                    <div className="tao-hd-right">
                        <div
                            className="staff-card"
                            style={{
                                position:
                                    'sticky',
                                top: 16,
                            }}
                        >
                            <h3
                                style={{
                                    margin:
                                        '0 0 16px',
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                Mở bàn {soBan}
                            </h3>

                            {cartItems.length === 0 ? (
                                <div className="empty-cart">
                                    Chưa chọn vé nào
                                </div>
                            ) : (
                                <>
                                    {cartItems.map(
                                        (item) => (
                                            <div
                                                key={
                                                    item.MaLoaiVe
                                                }
                                                className="summary-row"
                                            >
                                                <span
                                                    style={{
                                                        flex: 1,
                                                    }}
                                                >
                                                    {
                                                        item.TenLoaiVe
                                                    }
                                                    {' × '}
                                                    {
                                                        item.SoLuong
                                                    }
                                                </span>

                                                <span>
                                                    {fmt(
                                                        item.ThanhTien
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )}

                                    <div className="divider" />

                                    <div
                                        className="summary-row"
                                        style={{
                                            fontSize: 17,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span>
                                            Tạm tính
                                        </span>

                                        <span
                                            style={{
                                                color:
                                                    '#b45309',
                                            }}
                                        >
                                            {fmt(
                                                tongCart
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        className="diem-note"
                                        style={{
                                            fontSize: 12,
                                        }}
                                    >
                                        Thành viên và voucher sẽ được chọn khi thanh toán.
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="alert-danger">
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn-success"
                                onClick={handleMoBan}
                                disabled={
                                    cartItems.length === 0
                                    || loading
                                }
                            >
                                {loading
                                    ? 'Đang xử lý...'
                                    : `📌 Mở bàn ${soBan}`}
                            </button>

                            <button
                                type="button"
                                className="btn-ghost"
                                style={{
                                    width: '100%',
                                    marginTop: 8,
                                    marginLeft: 0,
                                }}
                                onClick={dong}
                                disabled={loading}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Xem bàn phục vụ */}
            {mode === 'xemBan' && bill && (
                <div className="tao-hd-layout">
                    <div className="tao-hd-left">
                        {dangGoiThem ? (
                            <KhoiChonVe
                                title={
                                    `Gọi thêm cho bàn ${bill.SoBan}`
                                }
                            />
                        ) : (
                            <div className="staff-card">
                                <div
                                    style={{
                                        display:
                                            'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems:
                                            'center',
                                        gap: 12,
                                        marginBottom: 12,
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Bàn {bill.SoBan}
                                        {' · '}
                                        {bill.MaHoaDon}
                                    </h3>

                                    <span
                                        style={{
                                            color:
                                                '#9ca3af',
                                            fontSize: 12,
                                        }}
                                    >
                                        Mở lúc{' '}
                                        {formatDateTime(
                                            bill.NgayLap
                                        )}
                                    </span>
                                </div>

                                <table className="staff-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Loại vé
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        'center',
                                                }}
                                            >
                                                SL
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        'right',
                                                }}
                                            >
                                                Đơn giá
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        'right',
                                                }}
                                            >
                                                Thành tiền
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {billDetails.map(
                                            (detail) => (
                                                <tr
                                                    key={
                                                        detail.MaChiTietHD
                                                    }
                                                >
                                                    <td>
                                                        {getTicketName(
                                                            detail
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            textAlign:
                                                                'center',
                                                        }}
                                                    >
                                                        {
                                                            detail.SoLuong
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            textAlign:
                                                                'right',
                                                        }}
                                                    >
                                                        {fmt(
                                                            detail.DonGia
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            textAlign:
                                                                'right',
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        {fmt(
                                                            Number(
                                                                detail.DonGia
                                                            )
                                                            * Number(
                                                                detail.SoLuong
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="tao-hd-right">
                        <div
                            className="staff-card"
                            style={{
                                position:
                                    'sticky',
                                top: 16,
                            }}
                        >
                            <h3
                                style={{
                                    margin:
                                        '0 0 12px',
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                {dangGoiThem
                                    ? 'Vé gọi thêm'
                                    : `Bàn ${bill.SoBan}`}
                            </h3>

                            {dangGoiThem ? (
                                <>
                                    {cartItems.length === 0 ? (
                                        <div className="empty-cart">
                                            Chưa chọn vé nào
                                        </div>
                                    ) : (
                                        <>
                                            {cartItems.map(
                                                (item) => (
                                                    <div
                                                        key={
                                                            item.MaLoaiVe
                                                        }
                                                        className="summary-row"
                                                    >
                                                        <span
                                                            style={{
                                                                flex: 1,
                                                            }}
                                                        >
                                                            {
                                                                item.TenLoaiVe
                                                            }
                                                            {' × '}
                                                            {
                                                                item.SoLuong
                                                            }
                                                        </span>

                                                        <span>
                                                            {fmt(
                                                                item.ThanhTien
                                                            )}
                                                        </span>
                                                    </div>
                                                )
                                            )}

                                            <div className="divider" />

                                            <div
                                                className="summary-row"
                                                style={{
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                <span>
                                                    Thêm
                                                </span>

                                                <span>
                                                    {fmt(
                                                        tongCart
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {error && (
                                        <div className="alert-danger">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="btn-success"
                                        onClick={
                                            handleThemMon
                                        }
                                        disabled={
                                            cartItems.length
                                                === 0
                                            || loading
                                        }
                                    >
                                        {loading
                                            ? 'Đang thêm...'
                                            : '✅ Xác nhận gọi thêm'}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{
                                            width: '100%',
                                            marginTop: 8,
                                            marginLeft: 0,
                                        }}
                                        onClick={() => {
                                            setDangGoiThem(
                                                false
                                            );

                                            setCart({});
                                            setError('');
                                        }}
                                        disabled={loading}
                                    >
                                        Quay lại
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div
                                        className="summary-row"
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span>
                                            Tạm tính
                                        </span>

                                        <span
                                            style={{
                                                color:
                                                    '#b45309',
                                            }}
                                        >
                                            {fmt(
                                                tongBill
                                            )}
                                        </span>
                                    </div>

                                    <div className="divider" />

                                    <div style={btnGrid}>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            style={btnCell}
                                            disabled={loading}
                                            onClick={() => {
                                                setCart({});
                                                setError('');
                                                void loadLoaiVe();
                                                setDangGoiThem(
                                                    true
                                                );
                                            }}
                                        >
                                            ➕ Gọi thêm
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-outline"
                                            style={btnCell}
                                            onClick={
                                                handleDoiBan
                                            }
                                            disabled={loading}
                                        >
                                            🔄 Đổi bàn
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-danger"
                                            style={btnCell}
                                            onClick={
                                                handleHuyBan
                                            }
                                            disabled={loading}
                                        >
                                            🚫 Hủy bàn
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-success"
                                            style={btnCell}
                                            onClick={
                                                moThanhToan
                                            }
                                            disabled={loading}
                                        >
                                            💳 Thanh toán
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{
                                            width: '100%',
                                            marginTop: 10,
                                            marginLeft: 0,
                                        }}
                                        onClick={dong}
                                        disabled={loading}
                                    >
                                        Đóng
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!mode && (
                <div className="staff-card">
                    <div className="empty-cart">
                        Chọn một bàn để bắt đầu.
                    </div>
                </div>
            )}

            {/* Modal thanh toán */}
            {payOpen
                && bill
                && createPortal(
                    <div
                        style={ovl}
                        onClick={closePayment}
                    >
                        <div
                            style={box}
                            role="dialog"
                            aria-modal="true"
                            aria-label={
                                `Thanh toán bàn ${bill.SoBan}`
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            {/* Header */}
                            <div style={mHead}>
                                <div>
                                    <div
                                        style={{
                                            color:
                                                '#111827',
                                            fontSize: 17,
                                            fontWeight: 700,
                                        }}
                                    >
                                        Thanh toán bàn{' '}
                                        {bill.SoBan}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 3,
                                            color:
                                                '#6b7280',
                                            fontSize: 13,
                                        }}
                                    >
                                        {bill.MaHoaDon}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closePayment
                                    }
                                    style={mClose}
                                    disabled={loading}
                                    aria-label="Đóng"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div style={mBody}>
                                <div
                                    style={{
                                        margin:
                                            '0 0 10px',
                                        fontSize: 14,
                                        fontWeight: 600,
                                    }}
                                >
                                    Khách có phải thành viên không?
                                </div>

                                {!khachHang ? (
                                    <>
                                        <div
                                            style={{
                                                display:
                                                    'flex',
                                                gap: 8,
                                            }}
                                        >
                                            <input
                                                className="staff-input"
                                                placeholder="Nhập số điện thoại thành viên..."
                                                value={sdt}
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSdt(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                onKeyDown={(
                                                    event
                                                ) => {
                                                    if (
                                                        event.key
                                                        === 'Enter'
                                                    ) {
                                                        void handleLookup();
                                                    }
                                                }}
                                            />

                                            <button
                                                type="button"
                                                className="btn-primary"
                                                style={{
                                                    minWidth:
                                                        90,
                                                }}
                                                onClick={
                                                    handleLookup
                                                }
                                                disabled={
                                                    sdtLoading
                                                }
                                            >
                                                {sdtLoading
                                                    ? '...'
                                                    : 'Tra cứu'}
                                            </button>
                                        </div>

                                        {sdtError && (
                                            <div className="alert-warn">
                                                {sdtError}
                                            </div>
                                        )}

                                        <div className="alert-info">
                                            Bỏ qua nếu khách không phải thành viên.
                                        </div>
                                    </>
                                ) : (
                                    <div className="kh-row">
                                        <div className="kh-badge">
                                            {khachHang.TenHang
                                                ?? khachHang
                                                    .hang_thanh_vien
                                                    ?.TenHang
                                                ?? khachHang
                                                    .hangThanhVien
                                                    ?.TenHang
                                                ?? 'Thành viên'}
                                        </div>

                                        <div>
                                            <div className="kh-name">
                                                {
                                                    khachHang.HoTen
                                                }
                                            </div>

                                            <div className="kh-sub">
                                                {
                                                    khachHang.SoDienThoai
                                                }
                                                {' · '}
                                                {Number(
                                                    khachHang.TongDiem
                                                    ?? 0
                                                )}
                                                {' '}
                                                điểm
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={
                                                removeCustomer
                                            }
                                            disabled={loading}
                                        >
                                            ✕ Bỏ
                                        </button>
                                    </div>
                                )}

                                {vouchers.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: 14,
                                        }}
                                    >
                                        <div className="voucher-title">
                                            Voucher có thể áp dụng
                                        </div>

                                        {vouchers.map(
                                            (voucher) => {
                                                const offer =
                                                    getVoucherOffer(
                                                        voucher
                                                    );

                                                const voucherId =
                                                    voucher.MaVoucherKhachHang;

                                                const checked =
                                                    selected.includes(
                                                        voucherId
                                                    );

                                                const locked =
                                                    hetTien
                                                    && !checked;

                                                const group =
                                                    offer.NhomUuDai;

                                                const discount =
                                                    Number(
                                                        offer.GiaTriGiam
                                                        ?? 0
                                                    );

                                                const minimumInvoice =
                                                    Number(
                                                        offer.GiaTriHoaDonToiThieu
                                                        ?? 0
                                                    );

                                                return (
                                                    <label
                                                        key={
                                                            voucherId
                                                        }
                                                        className="voucher-item"
                                                        title={
                                                            locked
                                                                ? 'Hóa đơn đã về 0 đồng.'
                                                                : ''
                                                        }
                                                        style={{
                                                            borderColor:
                                                                checked
                                                                    ? '#16a34a'
                                                                    : '#e5e7eb',

                                                            background:
                                                                checked
                                                                    ? '#f0fdf4'
                                                                    : locked
                                                                        ? '#f8fafc'
                                                                        : '#ffffff',

                                                            opacity:
                                                                locked
                                                                    ? 0.5
                                                                    : 1,

                                                            cursor:
                                                                locked
                                                                    ? 'not-allowed'
                                                                    : 'pointer',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                checked
                                                            }
                                                            disabled={
                                                                locked
                                                            }
                                                            onChange={() =>
                                                                toggleVoucher(
                                                                    voucherId
                                                                )
                                                            }
                                                            style={{
                                                                marginRight:
                                                                    10,

                                                                accentColor:
                                                                    '#16a34a',

                                                                cursor:
                                                                    locked
                                                                        ? 'not-allowed'
                                                                        : 'pointer',
                                                            }}
                                                        />

                                                        <div
                                                            style={{
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <div className="voucher-name">
                                                                {offer.TenUuDai
                                                                    ?? voucher.TenUuDai
                                                                    ?? voucherId}
                                                            </div>

                                                            <div className="voucher-sub">
                                                                {NHOM_LABEL[
                                                                    group
                                                                ]
                                                                    ?? group}

                                                                {group
                                                                    === 'PhanTram'
                                                                    ? ` · Giảm ${discount}%`
                                                                    : ` · ${fmt(discount)}`}

                                                                {' · HSD: '}
                                                                {voucher.NgayHetHan
                                                                    ?? '—'}

                                                                {minimumInvoice
                                                                    > 0 && (
                                                                    <>
                                                                        {' · Đơn tối thiểu: '}
                                                                        {fmt(
                                                                            minimumInvoice
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {checked && (
                                                            <span className="voucher-check">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            }
                                        )}

                                        {!hetTien
                                            && duVoucher && (
                                            <div
                                                style={
                                                    noteDuVoucher
                                                }
                                            >
                                                ⚠️ Đã chọn{' '}
                                                {selected.length}{' '}
                                                voucher nhưng chỉ{' '}
                                                <b>
                                                    {
                                                        soVoucherApDung
                                                    }
                                                </b>{' '}
                                                voucher được áp dụng.

                                                {voucherKhongApDung.length
                                                    > 0 && (
                                                    <>
                                                        {' '}
                                                        Mã không áp dụng:{' '}
                                                        <b>
                                                            {voucherKhongApDung.join(
                                                                ', '
                                                            )}
                                                        </b>.
                                                    </>
                                                )}

                                                {' '}
                                                Voucher bị bỏ qua không bị mất.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {khachHang
                                    && vouchers.length
                                        === 0 && (
                                    <div className="alert-info">
                                        Khách không có voucher khả dụng.
                                    </div>
                                )}

                                {/* Tổng kết */}
                                <div style={sumBox}>
                                    <div style={sumRow}>
                                        <span>
                                            Tạm tính
                                        </span>

                                        <span>
                                            {fmt(
                                                uoc
                                                    ? uoc.TongTienGoc
                                                    : tongBill
                                            )}
                                        </span>
                                    </div>

                                    {uoc
                                        && Number(
                                            uoc.TongGiam
                                        ) > 0 && (
                                        <div
                                            style={{
                                                ...sumRow,
                                                color:
                                                    '#16a34a',
                                            }}
                                        >
                                            <span>
                                                Giảm giá
                                                {' ('}
                                                {
                                                    soVoucherApDung
                                                }
                                                {' voucher)'}
                                            </span>

                                            <span>
                                                −
                                                {fmt(
                                                    uoc.TongGiam
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            height: 1,
                                            margin:
                                                '8px 0',
                                            background:
                                                '#e5e7eb',
                                        }}
                                    />

                                    <div
                                        style={{
                                            ...sumRow,
                                            fontSize: 18,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span>
                                            Khách trả
                                        </span>

                                        <span
                                            style={{
                                                color:
                                                    '#b45309',
                                            }}
                                        >
                                            {uocLoading
                                                ? '…'
                                                : fmt(
                                                    tongThanhToanUocTinh
                                                )}
                                        </span>
                                    </div>
                                </div>

                                {/* Điểm dự kiến */}
                                {khachHang && (
                                    <div
                                        style={
                                            uoc
                                            && Number(
                                                uoc.DiemTichLuy
                                            ) > 0
                                                ? pointBox
                                                : pointBoxGray
                                        }
                                    >
                                        {uocLoading
                                            ? 'Đang tính điểm…'
                                            : uoc
                                                && Number(
                                                    uoc.DiemTichLuy
                                                ) > 0
                                                ? (
                                                    <>
                                                        ⭐ Điểm tích lũy:{' '}
                                                        <b>
                                                            +
                                                            {
                                                                uoc.DiemTichLuy
                                                            }{' '}
                                                            điểm
                                                        </b>

                                                        {uoc.LaSinhNhat && (
                                                            <span>
                                                                {' '}
                                                                🎂 Đã áp dụng ưu đãi sinh nhật
                                                            </span>
                                                        )}

                                                        {uoc.QuyTac && (
                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        6,

                                                                    color:
                                                                        '#78716c',

                                                                    fontSize:
                                                                        12,

                                                                    lineHeight:
                                                                        1.7,
                                                                }}
                                                            >
                                                                {fmt(
                                                                    uoc.TongThanhToan
                                                                )}
                                                                {' ÷ '}
                                                                {fmt(
                                                                    uoc.QuyTac.SoTienQuyDoi
                                                                )}
                                                                {' × '}
                                                                {
                                                                    uoc.QuyTac.SoDiemNhan
                                                                }
                                                                {' = '}

                                                                <b>
                                                                    {
                                                                        uoc.QuyTac.DiemCoBan
                                                                    }{' '}
                                                                    điểm cơ bản
                                                                </b>

                                                                {uoc.QuyTac.ApDungHeSo && (
                                                                    <div>
                                                                        × hệ số{' '}
                                                                        <b>
                                                                            {
                                                                                uoc.QuyTac.HeSoNhanDiem
                                                                            }
                                                                        </b>{' '}
                                                                        vì hóa đơn đạt từ{' '}
                                                                        {fmt(
                                                                            uoc.QuyTac.GiaTriHoaDonToiThieu
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {!uoc.QuyTac.ApDungHeSo
                                                                    && Number(
                                                                        uoc.QuyTac.HeSoNhanDiem
                                                                    ) > 1
                                                                    && Number(
                                                                        uoc.QuyTac.GiaTriHoaDonToiThieu
                                                                    ) > 0 && (
                                                                    <div>
                                                                        Đạt{' '}
                                                                        {fmt(
                                                                            uoc.QuyTac.GiaTriHoaDonToiThieu
                                                                        )}{' '}
                                                                        để nhân hệ số ×
                                                                        {
                                                                            uoc.QuyTac.HeSoNhanDiem
                                                                        }
                                                                    </div>
                                                                )}

                                                                {uoc.LaSinhNhat && (
                                                                    <div>
                                                                        Áp dụng ưu đãi sinh nhật.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    4,
                                                                fontSize:
                                                                    12,
                                                            }}
                                                        >
                                                            Điểm sau giao dịch:{' '}

                                                            <b>
                                                                {Number(
                                                                    khachHang.TongDiem
                                                                    ?? 0
                                                                )
                                                                + Number(
                                                                    uoc.DiemTichLuy
                                                                    ?? 0
                                                                )}
                                                            </b>
                                                        </div>
                                                    </>
                                                )
                                                : 'Hóa đơn này không đủ điều kiện tích điểm.'}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={mFoot}>
                                <button
                                    type="button"
                                    onClick={
                                        closePayment
                                    }
                                    style={btnClose}
                                    disabled={loading}
                                >
                                    Đóng
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleThanhToan
                                    }
                                    disabled={
                                        loading
                                        || uocLoading
                                    }
                                    style={btnPay}
                                >
                                    {loading
                                        ? 'Đang xử lý...'
                                        : '💳 Xác nhận thanh toán'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
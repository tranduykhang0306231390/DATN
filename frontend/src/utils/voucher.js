import {
    formatMemberDate,
    formatMemberMoney,
    formatMemberNumber,
    toFiniteNumber,
} from "./memberRank.js";

const STORE_STATUS = {
    available: {
        key: "available",
        label: "Có thể đổi",
        reason: "Voucher đang sẵn sàng để đổi bằng điểm.",
        tone: "success",
        cardTone: "green",
        canRedeem: true,
    },
    processing: {
        key: "processing",
        label: "Đang xử lý",
        reason: "Yêu cầu đổi voucher đang được gửi.",
        tone: "info",
        cardTone: "cyan",
        canRedeem: false,
    },
    inactive: {
        key: "inactive",
        label: "Không hoạt động",
        reason: "Voucher hiện không ở trạng thái hoạt động.",
        tone: "neutral",
        cardTone: "muted",
        canRedeem: false,
    },
    upcoming: {
        key: "upcoming",
        label: "Chưa bắt đầu",
        reason: "Voucher chưa đến thời gian có hiệu lực.",
        tone: "info",
        cardTone: "cyan",
        canRedeem: false,
    },
    expired: {
        key: "expired",
        label: "Đã hết hạn",
        reason: "Voucher đã qua ngày kết thúc.",
        tone: "coral",
        cardTone: "muted",
        canRedeem: false,
    },
    outOfStock: {
        key: "out-of-stock",
        label: "Hết lượt đổi",
        reason: "Voucher hiện không còn số lượng để đổi.",
        tone: "coral",
        cardTone: "muted",
        canRedeem: false,
    },
    rankMismatch: {
        key: "rank-mismatch",
        label: "Không đúng hạng",
        reason: "Voucher không áp dụng cho hạng thành viên hiện tại.",
        tone: "purple",
        cardTone: "purple",
        canRedeem: false,
    },
    unknownPoints: {
        key: "unknown-points",
        label: "Chưa tải được điểm",
        reason: "Cần tải lại điểm hiện có trước khi đổi voucher.",
        tone: "warning",
        cardTone: "yellow",
        canRedeem: false,
    },
    unknownRank: {
        key: "unknown-rank",
        label: "Chưa tải được hạng",
        reason: "Cần tải lại hạng thành viên trước khi đổi voucher này.",
        tone: "warning",
        cardTone: "yellow",
        canRedeem: false,
    },
    insufficient: {
        key: "insufficient",
        label: "Chưa đủ điểm",
        reason: "Điểm hiện có chưa đủ để đổi voucher này.",
        tone: "warning",
        cardTone: "yellow",
        canRedeem: false,
    },
    invalid: {
        key: "invalid",
        label: "Dữ liệu chưa hợp lệ",
        reason: "Voucher đang thiếu thông tin cần thiết để đổi.",
        tone: "neutral",
        cardTone: "muted",
        canRedeem: false,
    },
};

const OWNED_STATUS = {
    available: {
        key: "owned-available",
        label: "Có thể sử dụng",
        tone: "success",
        cardTone: "green",
    },
    used: {
        key: "used",
        label: "Đã sử dụng",
        tone: "neutral",
        cardTone: "muted",
    },
    expired: {
        key: "expired",
        label: "Đã hết hạn",
        tone: "coral",
        cardTone: "muted",
    },
    unknown: {
        key: "unknown",
        label: "Chưa xác định",
        tone: "warning",
        cardTone: "yellow",
    },
};

export const getVoucherOffer = (voucher) => (
    voucher?.uu_dai || voucher?.uuDai || voucher || null
);

export const getDateKey = (value) => {
    if (!value) return null;
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

export const getVietnamDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

export const formatVoucherValue = (voucher, fallback = "—") => {
    const offer = getVoucherOffer(voucher);
    const value = toFiniteNumber(offer?.GiaTriGiam);

    if (!offer || value === null) return fallback;

    if (offer.NhomUuDai === "PhanTram") {
        return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
    }

    if (offer.NhomUuDai === "TangMon") return "Tặng món";
    if (offer.NhomUuDai === "GiamTien") return formatMemberMoney(value, fallback);

    return formatMemberNumber(value, fallback);
};

export const getVoucherTypeLabel = (voucher) => {
    const type = getVoucherOffer(voucher)?.NhomUuDai;

    if (type === "PhanTram") return "Giảm theo phần trăm";
    if (type === "TangMon") return "Quà tặng món";
    if (type === "GiamTien") return "Giảm trực tiếp";
    return "Ưu đãi thành viên";
};

export const getVoucherCardTone = (voucher) => {
    const type = getVoucherOffer(voucher)?.NhomUuDai;
    if (type === "PhanTram") return "purple";
    if (type === "TangMon") return "cyan";
    return "green";
};

export const getStoreVoucherStatus = ({
    voucher,
    currentPoints,
    memberRankCode,
    today = getVietnamDateKey(),
    isSubmitting = false,
}) => {
    const offer = getVoucherOffer(voucher);
    if (!offer || !offer.MaUuDai) return { ...STORE_STATUS.invalid };
    if (isSubmitting) return { ...STORE_STATUS.processing };

    if (offer.TrangThai !== "HoatDong") return { ...STORE_STATUS.inactive };

    const startDate = getDateKey(offer.NgayBatDau);
    const endDate = getDateKey(offer.NgayKetThuc);

    if (startDate && today && startDate > today) return { ...STORE_STATUS.upcoming };
    if (endDate && today && endDate < today) return { ...STORE_STATUS.expired };

    const stock = toFiniteNumber(offer.SoLuongTon);
    if (stock === null || stock <= 0) return { ...STORE_STATUS.outOfStock };

    if (offer.MaHangThanhVien) {
        if (!memberRankCode) return { ...STORE_STATUS.unknownRank };
        if (String(offer.MaHangThanhVien) !== String(memberRankCode)) {
            return { ...STORE_STATUS.rankMismatch };
        }
    }

    const requiredPoints = toFiniteNumber(offer.SoDiemCanDoi);
    if (requiredPoints === null || requiredPoints < 0) return { ...STORE_STATUS.invalid };

    const points = toFiniteNumber(currentPoints);
    if (points === null) return { ...STORE_STATUS.unknownPoints };

    if (points < requiredPoints) {
        return {
            ...STORE_STATUS.insufficient,
            missingPoints: requiredPoints - points,
        };
    }

    return { ...STORE_STATUS.available };
};

export const getOwnedVoucherStatus = (
    voucher,
    today = getVietnamDateKey(),
) => {
    if (!voucher || typeof voucher !== "object") return { ...OWNED_STATUS.unknown };
    if (voucher.TrangThai === "DaSuDung") return { ...OWNED_STATUS.used };

    const expiryDate = getDateKey(voucher.NgayHetHan);
    if (
        voucher.TrangThai === "HetHan" ||
        (expiryDate && today && expiryDate < today)
    ) {
        return { ...OWNED_STATUS.expired };
    }

    if (voucher.TrangThai === "ChuaSuDung") return { ...OWNED_STATUS.available };
    return { ...OWNED_STATUS.unknown };
};

export const normalizeVoucherPage = (payload) => {
    const currentPage = Math.max(1, Math.trunc(toFiniteNumber(payload?.current_page) || 1));
    const totalPages = Math.max(0, Math.trunc(toFiniteNumber(payload?.last_page) || 0));
    const totalItems = Math.max(0, Math.trunc(toFiniteNumber(payload?.total) || 0));

    return {
        items: Array.isArray(payload?.data) ? payload.data : [],
        currentPage,
        totalPages,
        totalItems,
        perPage: Math.max(0, Math.trunc(toFiniteNumber(payload?.per_page) || 0)),
    };
};

export const getVoucherPreviewPoints = (currentPoints, requiredPoints) => {
    const current = toFiniteNumber(currentPoints);
    const required = toFiniteNumber(requiredPoints);
    if (current === null || required === null) return null;
    return Math.max(0, current - Math.max(0, required));
};

export const formatVoucherDate = formatMemberDate;

export const getVoucherRequestError = (error) => {
    const status = error?.response?.status;

    if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) {
        return error.response?.data?.message || "Tài khoản không có quyền thực hiện thao tác này.";
    }
    if (status === 404) {
        return error.response?.data?.message || "Voucher không còn tồn tại hoặc vừa được cập nhật.";
    }

    if ([400, 409, 422].includes(status)) {
        return error.response?.data?.message || "Voucher không còn đủ điều kiện để đổi.";
    }

    if (!error?.response) return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
    return "Hệ thống chưa thể đổi voucher lúc này. Vui lòng thử lại sau.";
};

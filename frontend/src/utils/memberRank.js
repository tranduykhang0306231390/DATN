import { formatCalendarDateVi, normalizeCalendarDate } from "./customerDate.js";

const NUMBER_FORMATTER = new Intl.NumberFormat("vi-VN");
const MONEY_FORMATTER = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

export const toFiniteNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const clampPercentage = (value) => {
    const parsedValue = toFiniteNumber(value);
    if (parsedValue === null) return 0;
    return Math.min(100, Math.max(0, parsedValue));
};

const compareNullableNumbers = (left, right) => {
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return left - right;
};

export const sortMemberRanks = (ranks) => {
    if (!Array.isArray(ranks)) return [];

    return ranks
        .filter((rank) => rank && typeof rank === "object")
        .map((rank) => ({
            ...rank,
            quy_tac: rank.quy_tac || rank.quyTac || null,
        }))
        .sort((left, right) => {
            const leftOrder = toFiniteNumber(left.ThuTuHang);
            const rightOrder = toFiniteNumber(right.ThuTuHang);
            const orderDifference = leftOrder !== null && rightOrder !== null
                ? leftOrder - rightOrder
                : 0;

            if (orderDifference !== 0) return orderDifference;

            const pointDifference = compareNullableNumbers(
                toFiniteNumber(left.DiemToiThieu),
                toFiniteNumber(right.DiemToiThieu),
            );

            if (pointDifference !== 0) return pointDifference;

            const fallbackOrderDifference = compareNullableNumbers(leftOrder, rightOrder);
            if (fallbackOrderDifference !== 0) return fallbackOrderDifference;

            return String(left.MaHangThanhVien || "").localeCompare(
                String(right.MaHangThanhVien || ""),
                "vi",
                { numeric: true },
            );
        });
};

export const buildMembershipState = (points, ranks) => {
    const sortedRanks = sortMemberRanks(ranks);
    const rawPointValue = toFiniteNumber(points?.TongDiem);
    const currentPoints = rawPointValue === null ? null : Math.max(0, rawPointValue);
    const rawSpendValue = toFiniteNumber(points?.TongChiTieu);
    const currentSpend = rawSpendValue === null ? null : Math.max(0, rawSpendValue);
    const currentRankCode = points?.HangThanhVien || null;

    const baseState = {
        ranks: sortedRanks,
        currentPoints,
        currentSpend,
        currentRankCode,
        currentTier: null,
        nextTier: null,
        currentIndex: -1,
        percentage: 0,
        remainingPoints: null,
        remainingSpend: null,
        currentThreshold: null,
        nextThreshold: null,
        currentSpendThreshold: null,
        nextSpendThreshold: null,
        isHighestTier: false,
        // Chỉ tính riêng điều kiện điểm — giữ nguyên tên/ý nghĩa cũ vì đã
        // được dùng ở nơi khác (TierBenefitCard...).
        hasReachedNextThreshold: false,
        hasReachedSpendThreshold: false,
        // true khi đủ CẢ điểm lẫn chi tiêu — khớp điều kiện lên hạng thật
        // sự ở backend (DiemTichLuyService::hangXungDangTheoDiem).
        isEligibleForNextTier: false,
        hasEqualThresholds: false,
        hasInvalidThresholdOrder: false,
        status: "ready",
    };

    if (sortedRanks.length === 0) {
        return { ...baseState, status: "no-config" };
    }

    if (!currentRankCode) {
        return { ...baseState, status: "no-rank" };
    }

    const currentIndex = sortedRanks.findIndex(
        (rank) => String(rank.MaHangThanhVien) === String(currentRankCode),
    );

    if (currentIndex < 0) {
        return { ...baseState, status: "unknown-rank" };
    }

    const currentTier = sortedRanks[currentIndex];
    const nextTier = sortedRanks[currentIndex + 1] || null;
    const currentThreshold = toFiniteNumber(currentTier.DiemToiThieu);
    const nextThreshold = toFiniteNumber(nextTier?.DiemToiThieu);
    const isHighestTier = nextTier === null;

    if (currentPoints === null) {
        return {
            ...baseState,
            currentTier,
            nextTier,
            currentIndex,
            currentThreshold,
            nextThreshold,
            isHighestTier,
            status: "no-points",
        };
    }

    if (isHighestTier) {
        return {
            ...baseState,
            currentTier,
            currentIndex,
            currentThreshold,
            currentPoints,
            currentSpend,
            currentSpendThreshold: toFiniteNumber(currentTier.TongChiTieuToiThieu),
            percentage: 100,
            remainingPoints: 0,
            remainingSpend: 0,
            hasReachedSpendThreshold: true,
            isEligibleForNextTier: true,
            isHighestTier: true,
        };
    }

    if (currentThreshold === null || nextThreshold === null) {
        return {
            ...baseState,
            currentTier,
            nextTier,
            currentIndex,
            currentThreshold,
            nextThreshold,
            currentPoints,
            status: "invalid-threshold",
        };
    }

    const thresholdRange = nextThreshold - currentThreshold;
    const hasEqualThresholds = thresholdRange === 0;
    const hasInvalidThresholdOrder = thresholdRange < 0;
    const hasReachedNextThreshold = currentPoints >= nextThreshold;
    const pointPercentage = thresholdRange <= 0
        ? (hasReachedNextThreshold ? 100 : 0)
        : clampPercentage(
            ((currentPoints - currentThreshold) / thresholdRange) * 100,
        );

    /*
     * Mỗi hạng còn yêu cầu chi tiêu tối thiểu (TongChiTieuToiThieu), khớp
     * điều kiện lên hạng thật ở backend. Tiến trình hiển thị phải lấy điều
     * kiện nào CHƯA đạt (thấp hơn) làm chuẩn, vì thiếu 1 trong 2 là chưa
     * đủ điều kiện lên hạng — không riêng điểm là đủ.
     */
    const currentSpendThreshold = toFiniteNumber(currentTier.TongChiTieuToiThieu) ?? 0;
    const nextSpendThreshold = toFiniteNumber(nextTier?.TongChiTieuToiThieu) ?? 0;
    const spendValue = currentSpend ?? 0;
    const spendRange = nextSpendThreshold - currentSpendThreshold;
    const hasReachedSpendThreshold = spendValue >= nextSpendThreshold;
    const spendPercentage = spendRange <= 0
        ? (hasReachedSpendThreshold ? 100 : 0)
        : clampPercentage(
            ((spendValue - currentSpendThreshold) / spendRange) * 100,
        );

    const percentage = Math.min(pointPercentage, spendPercentage);

    return {
        ...baseState,
        currentTier,
        nextTier,
        currentIndex,
        currentThreshold,
        nextThreshold,
        currentSpendThreshold,
        nextSpendThreshold,
        currentPoints,
        currentSpend,
        percentage,
        remainingPoints: Math.max(0, nextThreshold - currentPoints),
        remainingSpend: Math.max(0, nextSpendThreshold - spendValue),
        hasReachedNextThreshold,
        hasReachedSpendThreshold,
        isEligibleForNextTier: hasReachedNextThreshold && hasReachedSpendThreshold,
        hasEqualThresholds,
        hasInvalidThresholdOrder,
    };
};

export const getTierTone = (index, total) => {
    if (index <= 0) return "green";
    if (index === total - 1) return "purple";
    if (total >= 4 && index === total - 2) return "gold";
    return "cyan";
};

export const formatMemberNumber = (value, fallback = "—") => {
    const parsedValue = toFiniteNumber(value);
    return parsedValue === null ? fallback : NUMBER_FORMATTER.format(parsedValue);
};

export const formatMemberMoney = (value, fallback = "—") => {
    const parsedValue = toFiniteNumber(value);
    return parsedValue === null ? fallback : MONEY_FORMATTER.format(parsedValue);
};

export const formatMemberDate = (value, fallback = "—") => {
    return formatCalendarDateVi(value, fallback);
};

export const formatMemberDateTime = (value, fallback = "—") => {
    if (!value) return fallback;

    const match = String(value)
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

    if (!match) return fallback;

    const [, year, month, day, hour, minute] = match;
    if (!normalizeCalendarDate(`${year}-${month}-${day}`)) return fallback;
    if (
        (hour && (Number(hour) < 0 || Number(hour) > 23))
        || (minute && (Number(minute) < 0 || Number(minute) > 59))
    ) {
        return fallback;
    }

    const date = `${day}/${month}/${year}`;

    return hour && minute ? `${date} ${hour}:${minute}` : date;
};

const extractNumericCode = (value) => {
    const match = String(value || "").match(/(\d+)$/);
    return match ? Number(match[1]) : null;
};

export const sortPointActivitiesNewest = (activities) => {
    if (!Array.isArray(activities)) return [];

    return [...activities].sort((left, right) => {
        const leftCode = extractNumericCode(left?.MaGiaoDichDiem);
        const rightCode = extractNumericCode(right?.MaGiaoDichDiem);

        if (leftCode !== null && rightCode !== null && leftCode !== rightCode) {
            return rightCode - leftCode;
        }

        return String(right?.MaGiaoDichDiem || "").localeCompare(
            String(left?.MaGiaoDichDiem || ""),
            "vi",
            { numeric: true },
        );
    });
};

export const getPointActivityDelta = (activity) => {
    const before = toFiniteNumber(activity?.SoDiemTruoc);
    const after = toFiniteNumber(activity?.SoDiemSau);
    const amount = Math.abs(toFiniteNumber(activity?.SoDiem) || 0);

    if (before !== null && after !== null && after !== before) {
        return after - before;
    }

    if (amount === 0) return 0;

    if (["DoiVoucher", "HoanDiemHuyHD"].includes(activity?.LoaiGiaoDich)) {
        return -amount;
    }

    return amount;
};

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const isLeapYear = (year) => (
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
);

const getDaysInMonth = (year, month) => {
    if (month === 2) return isLeapYear(year) ? 29 : 28;
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
};

export const normalizeCalendarDate = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const match = String(value).trim().match(CALENDAR_DATE_PATTERN);
    if (!match) return "";

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (
        !Number.isInteger(year)
        || year < 1
        || month < 1
        || month > 12
        || day < 1
        || day > getDaysInMonth(year, month)
    ) {
        return "";
    }

    return `${yearText}-${monthText}-${dayText}`;
};

export const formatCalendarDateVi = (value, fallback = "—") => {
    const normalized = normalizeCalendarDate(value);
    if (!normalized) return fallback;

    const [year, month, day] = normalized.split("-");
    return `${day}/${month}/${year}`;
};

export const formatCalendarDateForInput = (value) => normalizeCalendarDate(value);

export const normalizeCalendarDateForApi = (value) => normalizeCalendarDate(value);

export const getLocalCalendarDate = (date = new Date()) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const getPreviousLocalCalendarDate = (date = new Date()) => {
    const current = getLocalCalendarDate(date);
    if (!current) return "";

    let [year, month, day] = current.split("-").map(Number);
    if (day > 1) {
        day -= 1;
    } else if (month > 1) {
        month -= 1;
        day = getDaysInMonth(year, month);
    } else {
        year -= 1;
        month = 12;
        day = 31;
    }

    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
    ].join("-");
};

// Số điện thoại luôn được lưu/hiển thị ở định dạng "0xxxxxxxxx" trong toàn
// bộ ứng dụng (khớp với backend). Hàm này chỉ chuyển sang E.164 khi cần
// gọi thẳng Firebase — không dùng để hiển thị cho người dùng.
export const PHONE_STORAGE_FORMAT = /^0\d{9}$/;

export const toE164 = (phoneInStorageFormat) => {
    if (!PHONE_STORAGE_FORMAT.test(phoneInStorageFormat)) return null;
    return `+84${phoneInStorageFormat.slice(1)}`;
};

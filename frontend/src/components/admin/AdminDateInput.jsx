// src/components/admin/AdminDateInput.jsx
// Ô nhập ngày dùng chung cho khu vực admin — luôn hiển thị dd/mm/yyyy bất kể
// locale trình duyệt của người dùng (input type="date" gốc không làm được
// việc này vì định dạng hiển thị do trình duyệt/OS quyết định).
// value/onChange vẫn dùng chuỗi 'yyyy-mm-dd' như input date gốc, để không
// phải đổi state hay payload gửi backend ở các trang đang dùng nó.
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const parseYmd = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const formatYmd = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function AdminDateInput({
    value,
    onChange,
    min,
    max,
    placeholder = 'dd/mm/yyyy',
    disabled = false,
    style,
}) {
    return (
        <div className="admin-date-wrapper" style={style}>
            <DatePicker
                selected={parseYmd(value)}
                onChange={(date) => onChange(formatYmd(date))}
                dateFormat="dd/MM/yyyy"
                minDate={parseYmd(min)}
                maxDate={parseYmd(max)}
                placeholderText={placeholder}
                className="admin-input"
                disabled={disabled}
                isClearable
                autoComplete="off"
            />
        </div>
    );
}

import { useRef } from "react";

/**
 * Ô nhập mã OTP 6 chữ số dùng chung cho đăng ký, nhân viên đăng ký hộ,
 * đăng nhập OTP, quên mật khẩu và đổi mật khẩu — tự chuyển ô khi nhập,
 * hỗ trợ dán toàn bộ mã, không lưu gì vào localStorage/sessionStorage.
 */
function OtpInput({ length = 6, value, onChange, disabled = false, error, idPrefix = "otp" }) {
    const inputRefs = useRef([]);
    const digits = Array.from({ length }, (_, index) => value[index] || "");

    const setDigit = (index, digit) => {
        const next = digits.slice();
        next[index] = digit;
        onChange(next.join(""));
    };

    const focusInput = (index) => {
        inputRefs.current[index]?.focus();
        inputRefs.current[index]?.select();
    };

    const handleChange = (index, event) => {
        const raw = event.target.value.replace(/\D/g, "");
        if (!raw) {
            setDigit(index, "");
            return;
        }

        if (raw.length > 1) {
            // Dán cả mã vào 1 ô: rải đều các chữ số từ vị trí hiện tại.
            const next = digits.slice();
            for (let offset = 0; offset < raw.length && index + offset < length; offset += 1) {
                next[index + offset] = raw[offset];
            }
            onChange(next.join(""));
            focusInput(Math.min(index + raw.length, length - 1));
            return;
        }

        setDigit(index, raw);
        if (index < length - 1) focusInput(index + 1);
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            focusInput(index - 1);
        }
    };

    const handlePaste = (event) => {
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
        if (!pasted) return;
        event.preventDefault();
        onChange(pasted.slice(0, length));
        focusInput(Math.min(pasted.length, length - 1));
    };

    return (
        <div className="customer-form-field">
            <div
                className="otp-input__boxes"
                style={{ display: "flex", gap: "0.5rem" }}
                role="group"
                aria-label="Nhập mã OTP"
            >
                {digits.map((digit, index) => (
                    <input
                        key={`${idPrefix}-${index}`}
                        ref={(element) => { inputRefs.current[index] = element; }}
                        id={`${idPrefix}-${index}`}
                        className="customer-input otp-input__box"
                        style={{ width: "2.5rem", textAlign: "center", fontSize: "1.25rem" }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={length}
                        value={digit}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${idPrefix}-error` : undefined}
                        onChange={(event) => handleChange(index, event)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        onPaste={handlePaste}
                    />
                ))}
            </div>
            {error && (
                <small id={`${idPrefix}-error`} className="customer-auth__error" role="alert">
                    {error}
                </small>
            )}
        </div>
    );
}

export default OtpInput;

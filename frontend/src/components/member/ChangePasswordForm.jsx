import { useRef, useState } from "react";
import { FaEye, FaEyeSlash, FaKey, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { changePassword } from "../../api/authApi";
import { resetSessionVerificationCache } from "../../services/sessionService";
import { PASSWORD_PATTERN } from "../../utils/auth";
import { updateStoredAuthToken } from "../../utils/customerSession";

const EMPTY_FORM = {
    MatKhauHienTai: "",
    MatKhauMoi: "",
    MatKhauMoi_confirmation: "",
};

const FIELD_CONFIG = [
    {
        name: "MatKhauHienTai",
        label: "Mật khẩu hiện tại",
        autoComplete: "current-password",
    },
    {
        name: "MatKhauMoi",
        label: "Mật khẩu mới",
        autoComplete: "new-password",
    },
    {
        name: "MatKhauMoi_confirmation",
        label: "Xác nhận mật khẩu mới",
        autoComplete: "new-password",
    },
];

const getBackendFieldErrors = (error) => {
    const errors = error?.response?.status === 422 ? error.response.data?.errors : null;
    if (!errors || typeof errors !== "object") return {};

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages.filter(Boolean).join(" ") : String(messages || ""),
        ]),
    );
};

const validatePasswordForm = (formData) => {
    const errors = {};

    if (!formData.MatKhauHienTai) {
        errors.MatKhauHienTai = "Vui lòng nhập mật khẩu hiện tại.";
    }

    if (!PASSWORD_PATTERN.test(formData.MatKhauMoi)) {
        errors.MatKhauMoi = "Mật khẩu phải từ 8–20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).";
    } else if (formData.MatKhauMoi === formData.MatKhauHienTai) {
        errors.MatKhauMoi = "Mật khẩu mới không được trùng mật khẩu hiện tại.";
    }

    if (!formData.MatKhauMoi_confirmation) {
        errors.MatKhauMoi_confirmation = "Vui lòng xác nhận mật khẩu mới.";
    } else if (formData.MatKhauMoi !== formData.MatKhauMoi_confirmation) {
        errors.MatKhauMoi_confirmation = "Xác nhận mật khẩu mới không khớp.";
    }

    return errors;
};

function ChangePasswordForm({ onCancel, onSuccess, onSubmittingChange }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [visibleFields, setVisibleFields] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setFieldErrors((current) => ({ ...current, [name]: "" }));
        setRequestError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;

        const validationErrors = validatePasswordForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setRequestError("Vui lòng kiểm tra lại các trường được đánh dấu.");
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);
        onSubmittingChange?.(true);
        setFieldErrors({});
        setRequestError("");

        try {
            const response = await changePassword(formData);

            if (response.data?.token && !updateStoredAuthToken(response.data.token)) {
                resetSessionVerificationCache();
                setFormData({ ...EMPTY_FORM });
                navigate("/login", { replace: true });
                return;
            }

            resetSessionVerificationCache();
            setFormData({ ...EMPTY_FORM });
            setVisibleFields({});
            onSuccess?.(response.data?.message || "Đổi mật khẩu thành công.");
        } catch (error) {
            const backendErrors = getBackendFieldErrors(error);
            if (Object.keys(backendErrors).length > 0) {
                setFieldErrors(backendErrors);
                setRequestError(error.response?.data?.message || "Thông tin đổi mật khẩu chưa hợp lệ.");
            } else {
                setRequestError(
                    error?.response
                        ? "Không thể đổi mật khẩu lúc này. Các trường đã nhập vẫn được giữ lại."
                        : "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.",
                );
            }
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
            onSubmittingChange?.(false);
        }
    };

    return (
        <form className="change-password-form" onSubmit={handleSubmit} noValidate>
            {requestError && (
                <div className="change-password-form__notice" role="alert" aria-live="assertive">
                    {requestError}
                </div>
            )}

            <div className="change-password-form__grid">
                {FIELD_CONFIG.map((field) => {
                    const inputId = `change-password-${field.name}`;
                    const errorId = `${inputId}-error`;
                    const isVisible = Boolean(visibleFields[field.name]);
                    const hasError = Boolean(fieldErrors[field.name]);

                    return (
                        <div key={field.name} className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor={inputId}>{field.label}</label>
                            <div className="change-password-form__input-wrap">
                                <input
                                    id={inputId}
                                    className="customer-input"
                                    type={isVisible ? "text" : "password"}
                                    name={field.name}
                                    value={formData[field.name]}
                                    minLength={field.name === "MatKhauHienTai" ? undefined : 8}
                                    maxLength={20}
                                    required
                                    autoComplete={field.autoComplete}
                                    aria-invalid={hasError}
                                    aria-describedby={hasError ? errorId : undefined}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="change-password-form__visibility"
                                    onClick={() => setVisibleFields((current) => ({
                                        ...current,
                                        [field.name]: !current[field.name],
                                    }))}
                                    aria-label={`${isVisible ? "Ẩn" : "Hiện"} ${field.label.toLocaleLowerCase("vi-VN")}`}
                                    aria-pressed={isVisible}
                                >
                                    {isVisible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                                </button>
                            </div>
                            {hasError && (
                                <span id={errorId} className="customer-form-field__error" role="alert">
                                    {fieldErrors[field.name]}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="change-password-form__hint">
                <FaKey aria-hidden="true" />
                Mật khẩu mới gồm 8–20 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*#?&).
            </p>

            <div className="change-password-form__actions">
                <button
                    type="button"
                    className="customer-button customer-button--ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    <FaTimes aria-hidden="true" /> Hủy
                </button>
                <button type="submit" className="customer-button customer-button--primary" disabled={isSubmitting}>
                    <FaSave aria-hidden="true" /> {isSubmitting ? "Đang lưu…" : "Lưu mật khẩu"}
                </button>
            </div>
        </form>
    );
}

export default ChangePasswordForm;

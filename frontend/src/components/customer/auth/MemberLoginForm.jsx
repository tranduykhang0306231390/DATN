import { useRef, useState } from "react";
import { FaGift } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { memberLogin } from "../../../api/authApi";
import { resetSessionVerificationCache } from "../../../services/sessionService";
import {
    getAuthRequestMessage,
    getSafeMemberRedirect,
    normalizeFieldErrors,
} from "../../../utils/auth";
import { storeAuthSession } from "../../../utils/customerSession";
import { AuthMessage } from "./CustomerAuthLayout";
import PasswordField from "./PasswordField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MemberLoginForm({ idPrefix = "member-login" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const submittingRef = useRef(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setFieldErrors((current) => ({
            ...current,
            [field]: "",
        }));

        setGeneralError("");
    };

    const validate = () => {
        const errors = {};
        const email = form.email.trim();

        if (!email) {
            errors.email = "Vui lòng nhập email.";
        } else if (!EMAIL_PATTERN.test(email)) {
            errors.email = "Email không hợp lệ.";
        }

        if (!form.password) {
            errors.password = "Vui lòng nhập mật khẩu.";
        } else if (form.password.length < 6) {
            errors.password = "Mật khẩu tối thiểu 6 ký tự.";
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (event) => {
        event.preventDefault();

        if (submittingRef.current || !validate()) {
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
        setGeneralError("");

        try {
            const response = await memberLogin({
                email: form.email.trim(),
                password: form.password,
            });

            const stored = storeAuthSession({
                token: response.data?.token,
                role: "member",
                user: response.data?.user,
            });

            if (!stored) {
                setGeneralError(
                    "Trình duyệt không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt lưu trữ.",
                );
                return;
            }

            resetSessionVerificationCache();

            void Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công",
                timer: 1100,
                showConfirmButton: false,
            });

            navigate(getSafeMemberRedirect(location.state?.from), {
                replace: true,
            });
        } catch (error) {
            const responseErrors = normalizeFieldErrors(error);
            const hasFieldErrors = Object.keys(responseErrors).length > 0;

            if (hasFieldErrors) {
                setFieldErrors(responseErrors);
            }

            setGeneralError(
                hasFieldErrors
                    ? "Vui lòng kiểm tra lại các trường được đánh dấu."
                    : getAuthRequestMessage(
                          error,
                          "Email hoặc mật khẩu không chính xác.",
                      ),
            );
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const emailId = `${idPrefix}-email`;
    const passwordId = `${idPrefix}-password`;

    return (
        <form
            className="customer-auth__form"
            onSubmit={handleLogin}
            noValidate
        >
            <AuthMessage message={generalError} />

            <div className="customer-auth__field">
                <label htmlFor={emailId}>Email</label>

                <input
                    id={emailId}
                    name="email"
                    type="email"
                    className="customer-input customer-auth__input"
                    placeholder="tenban@example.com"
                    value={form.email}
                    onChange={(event) =>
                        updateField("email", event.target.value)
                    }
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                        fieldErrors.email
                            ? `${emailId}-error`
                            : undefined
                    }
                    disabled={submitting}
                    required
                />

                {fieldErrors.email && (
                    <small
                        id={`${emailId}-error`}
                        className="customer-auth__error"
                    >
                        {fieldErrors.email}
                    </small>
                )}
            </div>

            <PasswordField
                id={passwordId}
                name="password"
                label="Mật khẩu"
                value={form.password}
                onChange={(event) =>
                    updateField("password", event.target.value)
                }
                error={fieldErrors.password}
                autoComplete="current-password"
                disabled={submitting}
            />

            <div className="customer-auth__meta-row">
                <span>Mật khẩu không được lưu trên trình duyệt.</span>

                <Link
                    to="/forgot-password"
                    className="customer-auth__link"
                >
                    Quên mật khẩu?
                </Link>
            </div>

            <button
                className="customer-button customer-button--primary customer-auth__submit"
                type="submit"
                disabled={submitting}
            >
                {submitting ? (
                    <>
                        <span
                            className="customer-auth__submit-spinner"
                            aria-hidden="true"
                        />
                        Đang đăng nhập…
                    </>
                ) : (
                    <>
                        <FaGift aria-hidden="true" />
                        Đăng nhập
                    </>
                )}
            </button>
        </form>
    );
}

export default MemberLoginForm;
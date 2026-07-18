import { useRef, useState } from "react";
import {
    FaBirthdayCake,
    FaEdit,
    FaEnvelope,
    FaKey,
    FaPhoneAlt,
    FaSave,
    FaShieldAlt,
    FaTimes,
    FaUser,
    FaVenusMars,
} from "react-icons/fa";

import { updateMemberProfile } from "../../api/authApi";
import CustomerModal from "../customer/ui/CustomerModal";
import {
    formatCalendarDateForInput,
    formatCalendarDateVi,
    getLocalCalendarDate,
    getPreviousLocalCalendarDate,
    normalizeCalendarDateForApi,
} from "../../utils/customerDate";
import { syncStoredCustomerUser } from "../../utils/customerSession";
import {
    buildProfileEmail,
    GMAIL_EMAIL_DOMAIN,
    getEmailEditorState,
    normalizeEmailEditorInput,
} from "../../utils/memberProfileEmail";
import ChangePasswordForm from "./ChangePasswordForm";
import "../../assets/css/customer/account-profile.css";

const getProfileFormData = (user) => ({
    HoTen: user?.HoTen || "",
    Email: user?.Email || "",
    SoDienThoai: user?.SoDienThoai || "",
    NgaySinh: formatCalendarDateForInput(user?.NgaySinh),
    GioiTinh: user?.GioiTinh === "Nữ" ? "Nu" : (user?.GioiTinh || ""),
});

const formatGender = (value) => {
    if (value === "Nam") return "Nam";
    if (["Nu", "Nữ"].includes(value)) return "Nữ";
    return "—";
};

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

const validateProfile = (formData) => {
    const errors = {};
    const normalizedName = formData.HoTen.trim();
    const normalizedEmail = formData.Email.trim();
    const normalizedPhone = formData.SoDienThoai.trim();
    const normalizedBirthDate = normalizeCalendarDateForApi(formData.NgaySinh);

    if (!normalizedName) {
        errors.HoTen = "Vui lòng nhập họ và tên.";
    } else if (normalizedName.length < 3 || normalizedName.length > 100) {
        errors.HoTen = "Họ tên phải từ 3 đến 100 ký tự.";
    } else if (!/^[\p{L}\s]+$/u.test(normalizedName)) {
        errors.HoTen = "Họ tên chỉ được chứa chữ cái và khoảng trắng.";
    }

    if (!normalizedEmail || normalizedEmail.toLocaleLowerCase("vi-VN") === GMAIL_EMAIL_DOMAIN) {
        errors.Email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        errors.Email = "Email không đúng định dạng.";
    }

    if (!/^(0)[0-9]{9}$/.test(normalizedPhone)) {
        errors.SoDienThoai = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    }

    if (!normalizedBirthDate) {
        errors.NgaySinh = "Ngày sinh không hợp lệ.";
    } else if (normalizedBirthDate >= getLocalCalendarDate()) {
        errors.NgaySinh = "Ngày sinh phải trước ngày hiện tại.";
    }

    if (!["Nam", "Nu"].includes(formData.GioiTinh)) {
        errors.GioiTinh = "Vui lòng chọn giới tính.";
    }

    return {
        errors,
        payload: {
            HoTen: normalizedName,
            Email: normalizedEmail,
            SoDienThoai: normalizedPhone,
            NgaySinh: normalizedBirthDate,
            GioiTinh: formData.GioiTinh,
        },
    };
};

function FieldError({ id, message }) {
    if (!message) return null;
    return <span id={id} className="customer-form-field__error" role="alert">{message}</span>;
}

function MemberProfileSummary({
    user,
    activeModal,
    onRequestModal,
    onCloseModal,
    onProfileUpdated,
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
    const [savedProfile, setSavedProfile] = useState(() => getProfileFormData(user));
    const [formData, setFormData] = useState(() => getProfileFormData(user));
    const [emailEditor, setEmailEditor] = useState(() => getEmailEditorState(user?.Email));
    const [fieldErrors, setFieldErrors] = useState({});
    const [profileStatus, setProfileStatus] = useState(null);
    const [securityStatus, setSecurityStatus] = useState("");
    const savingRef = useRef(false);
    const isEditing = activeModal === "profile";
    const isChangingPassword = activeModal === "password";

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setFieldErrors((current) => ({ ...current, [name]: "" }));
        setProfileStatus(null);
    };

    const handleEmailChange = (event) => {
        setEmailEditor(normalizeEmailEditorInput(event.target.value));
        setFieldErrors((current) => ({ ...current, Email: "" }));
        setProfileStatus(null);
    };

    const startEditing = () => {
        setFormData({ ...savedProfile });
        setEmailEditor(getEmailEditorState(savedProfile.Email));
        setFieldErrors({});
        setProfileStatus(null);
        setSecurityStatus("");
        onRequestModal?.("profile");
    };

    const handleCancel = () => {
        setFormData({ ...savedProfile });
        setEmailEditor(getEmailEditorState(savedProfile.Email));
        setFieldErrors({});
        setProfileStatus(null);
        onCloseModal?.();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (savingRef.current) return;

        const validation = validateProfile({
            ...formData,
            Email: buildProfileEmail(emailEditor),
        });
        if (Object.keys(validation.errors).length > 0) {
            setFieldErrors(validation.errors);
            setProfileStatus({ tone: "error", message: "Vui lòng kiểm tra lại các trường được đánh dấu." });
            return;
        }

        savingRef.current = true;
        setIsSaving(true);
        setFieldErrors({});
        setProfileStatus(null);

        try {
            const response = await updateMemberProfile(validation.payload);
            const responseUser = response.data?.user;
            const updatedUser = {
                ...(user || {}),
                ...validation.payload,
                ...(responseUser && typeof responseUser === "object" ? responseUser : {}),
            };
            const updatedProfile = getProfileFormData(updatedUser);
            setSavedProfile(updatedProfile);
            setFormData(updatedProfile);
            setEmailEditor(getEmailEditorState(updatedProfile.Email));
            syncStoredCustomerUser(updatedUser);
            onProfileUpdated?.(updatedUser);

            setProfileStatus({
                tone: "success",
                message: response.data?.message || "Thông tin cá nhân đã được cập nhật.",
            });
            onCloseModal?.();
        } catch (error) {
            const backendErrors = getBackendFieldErrors(error);
            if (Object.keys(backendErrors).length > 0) {
                setFieldErrors(backendErrors);
                setProfileStatus({ tone: "error", message: "Một số thông tin chưa hợp lệ. Dữ liệu bạn nhập vẫn được giữ lại." });
            } else {
                setProfileStatus({
                    tone: "error",
                    message: error?.response
                        ? "Không thể cập nhật hồ sơ lúc này. Dữ liệu bạn nhập vẫn được giữ lại."
                        : "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.",
                });
            }
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    };

    const handlePasswordSuccess = (message) => {
        setIsPasswordSubmitting(false);
        setSecurityStatus(message || "Mật khẩu đã được thay đổi thành công.");
        onCloseModal?.();
    };

    return (
        <div className="member-profile-shell">
            <article className={`member-profile-summary ${profileStatus?.tone === "success" ? "is-updated" : ""}`}>
                <header className="member-profile-summary__header">
                    <div>
                        <span className="member-profile-summary__eyebrow">Hồ sơ thành viên</span>
                        <h2>Thông tin cá nhân</h2>
                    </div>
                    <div className="member-profile-summary__actions">
                        <button
                            type="button"
                            className="customer-button customer-button--primary"
                            onClick={startEditing}
                            aria-haspopup="dialog"
                        >
                            <FaEdit aria-hidden="true" /> Chỉnh sửa
                        </button>
                        <button
                            type="button"
                            className="customer-button customer-button--secondary"
                            onClick={() => {
                                setSecurityStatus("");
                                onRequestModal?.("password");
                            }}
                            aria-haspopup="dialog"
                        >
                            <FaKey aria-hidden="true" />
                            Đổi mật khẩu
                        </button>
                    </div>
                </header>

                {profileStatus?.tone === "success" && (
                    <div className="member-profile__notice member-profile__notice--success" role="status" aria-live="polite">
                        {profileStatus.message}
                    </div>
                )}

                {securityStatus && (
                    <div className="member-profile__notice member-profile__notice--success" role="status" aria-live="polite">
                        <FaShieldAlt aria-hidden="true" /> {securityStatus}
                    </div>
                )}

                <dl className="member-profile-summary__details" aria-label="Thông tin hồ sơ hiện tại">
                    <div>
                        <dt><FaUser aria-hidden="true" /> Họ và tên</dt>
                        <dd>{savedProfile.HoTen || "—"}</dd>
                    </div>
                    <div>
                        <dt><FaEnvelope aria-hidden="true" /> Email</dt>
                        <dd>{savedProfile.Email || "—"}</dd>
                    </div>
                    <div>
                        <dt><FaPhoneAlt aria-hidden="true" /> Số điện thoại</dt>
                        <dd>{savedProfile.SoDienThoai || "—"}</dd>
                    </div>
                    <div>
                        <dt><FaBirthdayCake aria-hidden="true" /> Ngày sinh</dt>
                        <dd>{formatCalendarDateVi(savedProfile.NgaySinh)}</dd>
                    </div>
                    {savedProfile.GioiTinh && (
                        <div>
                            <dt><FaVenusMars aria-hidden="true" /> Giới tính</dt>
                            <dd>{formatGender(savedProfile.GioiTinh)}</dd>
                        </div>
                    )}
                </dl>
            </article>

            <CustomerModal
                open={isEditing}
                onClose={handleCancel}
                title="Chỉnh sửa thông tin"
                eyebrow="Hồ sơ thành viên"
                busy={isSaving}
                className="customer-dialog--profile"
                titleId="member-profile-modal-title"
            >
                <form className="member-profile__form" onSubmit={handleSubmit} noValidate>
                    {profileStatus?.tone === "error" && (
                        <div className="member-profile__notice member-profile__notice--error" role="alert">
                            {profileStatus.message}
                        </div>
                    )}
                    <div className="member-profile__form-grid">
                        <div className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor="profile-name">Họ và tên</label>
                            <input
                                id="profile-name"
                                className="customer-input"
                                type="text"
                                name="HoTen"
                                value={formData.HoTen}
                                maxLength={100}
                                required
                                autoComplete="name"
                                aria-invalid={Boolean(fieldErrors.HoTen)}
                                aria-describedby={fieldErrors.HoTen ? "profile-name-error" : undefined}
                                onChange={handleChange}
                            />
                            <FieldError id="profile-name-error" message={fieldErrors.HoTen} />
                        </div>

                        <div className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor="profile-email">Email</label>
                            <div className={`member-profile__email-control ${fieldErrors.Email ? "is-invalid" : ""}`}>
                                <input
                                    id="profile-email"
                                    className="customer-input"
                                    type={emailEditor.mode === "gmail" ? "text" : "email"}
                                    name="Email"
                                    value={emailEditor.value}
                                    maxLength={100}
                                    required
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck="false"
                                    inputMode="email"
                                    aria-invalid={Boolean(fieldErrors.Email)}
                                    aria-describedby={fieldErrors.Email
                                        ? "profile-email-help profile-email-error"
                                        : "profile-email-help"}
                                    onChange={handleEmailChange}
                                />
                                {emailEditor.mode === "gmail" && (
                                    <span className="member-profile__email-domain" aria-hidden="true">
                                        {GMAIL_EMAIL_DOMAIN}
                                    </span>
                                )}
                            </div>
                            <span id="profile-email-help" className="customer-form-field__help">
                                {emailEditor.mode === "gmail"
                                    ? "Chỉ nhập phần tên trước @gmail.com; bạn cũng có thể dán một email khác đầy đủ."
                                    : "Nhập địa chỉ email đầy đủ."}
                            </span>
                            <FieldError id="profile-email-error" message={fieldErrors.Email} />
                        </div>

                        <div className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor="profile-phone">Số điện thoại</label>
                            <input
                                id="profile-phone"
                                className="customer-input"
                                type="tel"
                                name="SoDienThoai"
                                value={formData.SoDienThoai}
                                maxLength={10}
                                inputMode="numeric"
                                required
                                autoComplete="tel"
                                aria-invalid={Boolean(fieldErrors.SoDienThoai)}
                                aria-describedby={fieldErrors.SoDienThoai ? "profile-phone-error" : "profile-phone-help"}
                                onChange={handleChange}
                            />
                            <span id="profile-phone-help" className="customer-form-field__help">10 chữ số, bắt đầu bằng 0.</span>
                            <FieldError id="profile-phone-error" message={fieldErrors.SoDienThoai} />
                        </div>

                        <div className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor="profile-birth-date">Ngày sinh</label>
                            <input
                                id="profile-birth-date"
                                className="customer-input"
                                type="date"
                                name="NgaySinh"
                                value={formData.NgaySinh}
                                max={getPreviousLocalCalendarDate()}
                                required
                                autoComplete="bday"
                                aria-invalid={Boolean(fieldErrors.NgaySinh)}
                                aria-describedby={fieldErrors.NgaySinh ? "profile-birth-date-error" : undefined}
                                onChange={handleChange}
                            />
                            <FieldError id="profile-birth-date-error" message={fieldErrors.NgaySinh} />
                        </div>

                        <div className="customer-form-field">
                            <label className="customer-form-field__label" htmlFor="profile-gender">Giới tính</label>
                            <select
                                id="profile-gender"
                                className="customer-select"
                                name="GioiTinh"
                                value={formData.GioiTinh}
                                required
                                aria-invalid={Boolean(fieldErrors.GioiTinh)}
                                aria-describedby={fieldErrors.GioiTinh ? "profile-gender-error" : undefined}
                                onChange={handleChange}
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nu">Nữ</option>
                            </select>
                            <FieldError id="profile-gender-error" message={fieldErrors.GioiTinh} />
                        </div>
                    </div>

                    <div className="member-profile__actions member-profile__actions--form">
                        <button
                            type="button"
                            className="customer-button customer-button--ghost"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <FaTimes aria-hidden="true" /> Hủy
                        </button>
                        <button type="submit" className="customer-button customer-button--primary" disabled={isSaving}>
                            <FaSave aria-hidden="true" /> {isSaving ? "Đang lưu…" : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </CustomerModal>

            <CustomerModal
                open={isChangingPassword}
                onClose={onCloseModal}
                title="Đổi mật khẩu"
                eyebrow="Bảo mật tài khoản"
                busy={isPasswordSubmitting}
                className="customer-dialog--password"
                titleId="member-password-modal-title"
            >
                <section className="member-profile__security" aria-label="Biểu mẫu đổi mật khẩu">
                    <div className="member-profile__security-heading">
                        <span aria-hidden="true"><FaShieldAlt /></span>
                        <div>
                            <h3>Bảo vệ tài khoản của bạn</h3>
                            <p>Đổi mật khẩu định kỳ và không chia sẻ mật khẩu với người khác.</p>
                        </div>
                    </div>
                    <ChangePasswordForm
                        onCancel={onCloseModal}
                        onSuccess={handlePasswordSuccess}
                        onSubmittingChange={setIsPasswordSubmitting}
                    />
                </section>
            </CustomerModal>
        </div>
    );
}

export default MemberProfileSummary;

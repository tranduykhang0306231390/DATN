import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function PasswordField({
    id,
    name,
    label,
    value,
    onChange,
    error,
    help,
    autoComplete,
    disabled = false,
}) {
    const [isVisible, setIsVisible] = useState(false);
    const errorId = error ? `${id}-error` : undefined;
    const helpId = help ? `${id}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

    return (
        <div className="customer-auth__field">
            <label htmlFor={id}>{label}</label>
            <div className="customer-auth__password">
                <input
                    id={id}
                    name={name}
                    type={isVisible ? "text" : "password"}
                    className="customer-input customer-auth__input"
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    disabled={disabled}
                    required
                />
                <button
                    type="button"
                    onClick={() => setIsVisible((current) => !current)}
                    aria-label={isVisible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
                    aria-controls={id}
                    disabled={disabled}
                >
                    {isVisible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
            </div>
            {help && <small id={helpId} className="customer-auth__help">{help}</small>}
            {error && <small id={errorId} className="customer-auth__error">{error}</small>}
        </div>
    );
}

export default PasswordField;

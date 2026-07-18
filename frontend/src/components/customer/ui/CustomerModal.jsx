import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

function CustomerModal({
    open,
    onClose,
    title,
    eyebrow,
    children,
    footer = null,
    busy = false,
    closeOnBackdrop = true,
    className = "",
    titleId = "customer-modal-title",
}) {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previousFocusRef = useRef(null);
    const busyRef = useRef(busy);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        busyRef.current = busy;
        onCloseRef.current = onClose;
    }, [busy, onClose]);

    useEffect(() => {
        if (!open) return undefined;

        previousFocusRef.current = document.activeElement;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                if (!busyRef.current) onCloseRef.current?.();
                return;
            }

            if (event.key !== "Tab" || !dialogRef.current) return;

            const focusableElements = dialogRef.current.querySelectorAll(
                'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            );

            if (focusableElements.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    const handleBackdropMouseDown = (event) => {
        if (
            event.target === event.currentTarget &&
            closeOnBackdrop &&
            !busy
        ) {
            onClose?.();
        }
    };

    return createPortal(
        <div className="customer-app customer-app--portal">
            <div className="customer-dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
                <section
                    ref={dialogRef}
                    className={`customer-dialog ${className}`.trim()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-busy={busy || undefined}
                    tabIndex={-1}
                >
                    <header className="customer-dialog__header">
                        <div>
                            {eyebrow && <span>{eyebrow}</span>}
                            <h2 id={titleId}>{title}</h2>
                        </div>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            className="customer-dialog__close"
                            onClick={onClose}
                            disabled={busy}
                            aria-label={`Đóng ${title}`}
                        >
                            <FaTimes aria-hidden="true" />
                        </button>
                    </header>

                    <div className="customer-dialog__body">{children}</div>
                    {footer && <footer className="customer-dialog__footer">{footer}</footer>}
                </section>
            </div>
        </div>,
        document.body,
    );
}

export default CustomerModal;

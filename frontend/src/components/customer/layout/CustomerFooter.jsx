import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWebSetting } from "../../../api/webSettingApi";
import LoadingSkeleton from "../ui/LoadingSkeleton";
import { GUEST_LINKS, MEMBER_LINKS } from "./CustomerNavigation";

function CustomerFooter({ isAuthenticated = false }) {
    const [setting, setSetting] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        getWebSetting()
            .then((response) => {
                if (isMounted) setSetting(response.data.data || response.data);
            })
            .catch(() => {
                if (isMounted) setHasError(true);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <footer className="customer-footer" id="footer">
            <div className="customer-footer__shape customer-footer__shape--one" aria-hidden="true" />
            <div className="customer-footer__shape customer-footer__shape--two" aria-hidden="true" />

            <div className="customer-shell customer-footer__grid">
                <section className="customer-footer__about" aria-labelledby="customer-footer-about">
                    <h2 id="customer-footer-about">{setting?.TenWebsite || "BUFFET VIP"}</h2>
                    {isLoading ? (
                        <LoadingSkeleton lines={2} ariaLabel="Đang tải thông tin website" />
                    ) : (
                        <>
                            {setting?.NoiDungWebsite && <p>{setting.NoiDungWebsite}</p>}
                            {hasError && (
                                <p className="customer-footer__muted" role="status">
                                    Chưa thể tải nội dung giới thiệu.
                                </p>
                            )}
                        </>
                    )}
                </section>

                <nav className="customer-footer__links" aria-label="Liên kết khách hàng">
                    <h2>Khám phá</h2>
                    <ul>
                        {(isAuthenticated ? MEMBER_LINKS : GUEST_LINKS).map((item) => (
                            <li key={item.to || item.href}>
                                {item.to ? (
                                    <Link to={item.to}>{item.label}</Link>
                                ) : (
                                    <a href={item.href}>{item.label}</a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="customer-footer__contact" aria-labelledby="customer-footer-contact">
                    <h2 id="customer-footer-contact">Liên hệ</h2>
                    {isLoading && <LoadingSkeleton lines={3} ariaLabel="Đang tải thông tin liên hệ" />}
                    {!isLoading && !hasError && (
                        <ul>
                            {setting?.EmailLienHe && <li>Email: {setting.EmailLienHe}</li>}
                            {setting?.SoDienThoai && <li>Hotline: {setting.SoDienThoai}</li>}
                            {setting?.DiaChi && <li>{setting.DiaChi}</li>}
                        </ul>
                    )}
                    {!isLoading && hasError && (
                        <p className="customer-footer__muted" role="status">
                            Chưa thể tải thông tin liên hệ.
                        </p>
                    )}
                </section>
            </div>

            <div className="customer-shell customer-footer__bottom">
                <span>
                    © {new Date().getFullYear()} {setting?.TenWebsite || "BUFFET VIP"}.
                </span>
                <span>Chương trình khách hàng thân thiết</span>
            </div>
        </footer>
    );
}

export default CustomerFooter;

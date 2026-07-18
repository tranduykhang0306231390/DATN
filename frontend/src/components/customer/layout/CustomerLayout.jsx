import CustomerFooter from "./CustomerFooter";
import CustomerHeader from "./CustomerHeader";

import "../../../assets/css/customer/tokens.css";
import "../../../assets/css/customer/foundation.css";
import "../../../assets/css/customer/layout.css";
import "../../../assets/css/customer/ui.css";

function CustomerLayout({
    children,
    isAuthenticated = false,
    user = null,
    notificationSlot = null,
    onLogout,
    isLoggingOut = false,
}) {
    return (
        <div className="customer-app">
            <a className="customer-skip-link" href="#customer-main-content">
                Bỏ qua điều hướng
            </a>

            <CustomerHeader
                isAuthenticated={isAuthenticated}
                user={user}
                notificationSlot={notificationSlot}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
            />

            <main id="customer-main-content" className="customer-main">
                {children}
            </main>

            <CustomerFooter isAuthenticated={isAuthenticated} />
        </div>
    );
}

export default CustomerLayout;

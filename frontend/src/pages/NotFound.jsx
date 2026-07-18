import { FaCompass } from "react-icons/fa";
import { Link } from "react-router-dom";

import EmptyState from "../components/customer/ui/EmptyState";

function NotFound() {
    return (
        <div className="customer-shell customer-page-state">
            <EmptyState
                as="h1"
                icon={<FaCompass />}
                title="Không tìm thấy trang"
                description="Đường dẫn này không tồn tại hoặc đã được thay đổi."
                action={(
                    <Link to="/" className="customer-button customer-button--primary">
                        Về trang chủ
                    </Link>
                )}
            />
        </div>
    );
}

export default NotFound;

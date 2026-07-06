import { Link } from "react-router-dom";

function Navbar() {

    return (

        <header className="public-header">

            <div className="container">

                <div className="navbar-wrapper">

                    {/* Logo */}

                    <div className="logo">

                        <Link to="/">

                            BUFFET VIP

                        </Link>

                    </div>

                    {/* Menu */}

                    <nav className="menu">

                        <a href="/">Trang chủ</a>

                        <a href="#ticket">

                            Loại vé

                        </a>

                        <a href="#quyenloi">Quyền lợi</a>

                        <a href="#footer">

                            Liên hệ

                        </a>

                    </nav>

                    {/* Button */}

                    <div className="navbar-action">

                        <Link
                            to="/login"
                            className="btn-login"
                        >

                            Đăng nhập

                        </Link>

                        <Link
                            to="/register"
                            className="btn-register"
                        >

                            Đăng ký

                        </Link>

                    </div>

                </div>

            </div>

        </header>

    );

}

export default Navbar;
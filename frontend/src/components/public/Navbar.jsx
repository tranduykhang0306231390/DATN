import { Link } from "react-router-dom";

function Navbar() {

    return (

        <header className="public-header">

            <div className="container">

                <div className="navbar-wrapper">



                    <img
                        src="http://127.0.0.1:8000/logo/logo.png"
                        alt="BUFFET VIP"
                        style={{
                            width: "80px",
                            height: "80px",
                        }}
                    />

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
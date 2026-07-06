import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { memberLogin } from "../../api/authApi";

function LoginSection() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        email: "",
        password: ""

    });

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const res = await memberLogin(formData);

            localStorage.setItem("token", res.data.token);

            localStorage.setItem("role", res.data.role);

            localStorage.setItem(

                "user",

                JSON.stringify(res.data.user)

            );

            Swal.fire({

                icon: "success",

                title: "Đăng nhập thành công",

                timer: 1200,

                showConfirmButton: false

            });

            navigate("/member/home");

        } catch (err) {

            Swal.fire({

                icon: "error",

                title: "Đăng nhập thất bại",

                text:

                    err.response?.data?.message ||

                    "Có lỗi xảy ra."

            });

        }

    };

    return (

        <section className="login-section">

            <div className="container">

                <div className="login-wrapper">

                    {/* LEFT */}

                    <div className="login-left">

                        <h2>

                            Đăng nhập

                        </h2>

                        <p className="login-desc">

                            Đăng nhập để tích điểm, nhận ưu đãi và quản lý
                            tài khoản thành viên Buffet VIP.

                        </p>

                        <form onSubmit={handleLogin}>

                            <div className="form-group">

                                <label>

                                    Email

                                </label>

                                <input

                                    type="email"

                                    name="email"

                                    value={formData.email}

                                    onChange={handleChange}

                                    placeholder="Nhập email"

                                    className="form-control"

                                />

                            </div>

                            <div className="form-group">

                                <label>

                                    Mật khẩu

                                </label>

                                <input

                                    type="password"

                                    name="password"

                                    value={formData.password}

                                    onChange={handleChange}

                                    placeholder="Nhập mật khẩu"

                                    className="form-control"

                                />

                            </div>

                            <button
                                className="login-btn"
                                type="submit"
                            >

                                Đăng nhập

                            </button>

                        </form>

                    </div>

                    {/* RIGHT */}

                    <div className="login-right">

                        <h2>

                            Chưa phải là thành viên?

                        </h2>

                        <p>

                            Tham gia chương trình thành viên Buffet VIP để
                            tích điểm sau mỗi hóa đơn và nhận nhiều ưu đãi
                            độc quyền.

                        </p>

                        <Link
                            to="/register"
                            className="register-btn"
                        >

                            Tham gia ngay

                        </Link>

                    </div>

                </div>

            </div>

        </section>

    );

}

export default LoginSection;
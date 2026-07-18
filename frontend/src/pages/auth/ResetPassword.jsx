import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import Swal from "sweetalert2";

function ResetPassword() {

    const navigate = useNavigate();

    const location = useLocation();

    const { Email, SoDienThoai, NgaySinh } = location.state;

    const [MatKhau, setMatKhau] = useState("");

    const [Confirm, setConfirm] = useState("");

    const handleSubmit = async (e)=>{

        e.preventDefault();

        try{

            await resetPassword({

                Email,

                SoDienThoai,

                NgaySinh,

                MatKhau,

                MatKhau_confirmation:Confirm

            });

            Swal.fire({

                icon:"success",

                title:"Đổi mật khẩu thành công"

            });

            navigate("/login");

        }
        catch(err){

            Swal.fire({

                icon:"error",

                title:"Lỗi",

                text:err.response?.data?.message

            });

        }

    }

    return(

        <div className="auth-container">

            <div className="auth-card">

                <h1 className="restaurant-logo">

                    BUFFET VIP

                </h1>

                <h2 className="auth-title">

                    Đổi mật khẩu

                </h2>

                <form onSubmit={handleSubmit}>

                    <input

                        type="password"

                        className="auth-input"

                        placeholder="Mật khẩu mới"

                        value={MatKhau}

                        onChange={(e)=>setMatKhau(e.target.value)}

                    />

                    <input

                        type="password"

                        className="auth-input mt-3"

                        placeholder="Xác nhận mật khẩu"

                        value={Confirm}

                        onChange={(e)=>setConfirm(e.target.value)}

                    />

                    <button

                        className="auth-btn mt-4"

                    >

                        Đổi mật khẩu

                    </button>

                </form>

            </div>

        </div>

    );

}

export default ResetPassword;
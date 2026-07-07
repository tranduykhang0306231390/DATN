import { useEffect, useState } from "react";
import { getWebSetting } from "../../api/webSettingApi";

function Footer() {

    const [setting, setSetting] = useState(null);

    useEffect(() => {
        loadSetting();
    }, []);

    const loadSetting = async () => {
        try {

            const res = await getWebSetting();

            // nếu API trả về {data: {...}}
            setSetting(res.data.data || res.data);

        } catch (error) {

            console.log(error);

        }
    };

    if (!setting) {
        return null;
    }

    return (

        <footer className="public-footer" id="footer">

            <div className="container">

                <div className="footer-grid">

                    <div className="footer-item">

                        <h5>VỀ {setting.TenWebsite}</h5>

                        <p>

                            {setting.NoiDungWebsite}

                        </p>

                    </div>

                    <div className="footer-item">

                        <h5>LIÊN HỆ</h5>

                        <ul>

                            <li>Email: {setting.EmailLienHe}</li>

                            <li>Hotline: {setting.SoDienThoai}</li>

                            <li>{setting.DiaChi}</li>

                        </ul>

                    </div>

                </div>

                <div className="footer-bottom">

                    © {new Date().getFullYear()} {setting.TenWebsite}. All Rights Reserved.

                </div>

            </div>

        </footer>

    );

}

export default Footer;
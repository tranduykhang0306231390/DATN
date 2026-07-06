import { Outlet } from "react-router-dom";

import Navbar from "../components/public/Navbar";
import Footer from "../components/public/Footer";

import "../assets/css/public.css";

function PublicLayout() {

    return (

        <>

            <Navbar />

            <main>

                <Outlet />

            </main>

            <Footer />

        </>

    );

}

export default PublicLayout;
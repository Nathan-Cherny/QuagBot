import Footer from "./Footer"
import Navbar from "./Navbar"

function PageWrapper({ children }) {
    console.log("test")
    return (
        <>
            <Navbar />
            <div className="app-body">
                {children}
            </div>
            <Footer />
        </>
    );
}

export default PageWrapper;

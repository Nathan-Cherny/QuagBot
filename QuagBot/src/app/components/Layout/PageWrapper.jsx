import Footer from "./Footer"
import Navbar from "./Navbar"

function PageWrapper({ className, children }) {
    return (
        <>
            <Navbar />
            <div className={`app-body ${className}`}>
                {children}
            </div>
            <Footer />
        </>
    );
}

export default PageWrapper;

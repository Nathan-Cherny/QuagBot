import Footer from "./Footer"
import Navbar from "./Navbar"

// `basic` gives plain content pages (About, Profile, Log in, Sign up) a centered
// half-width column. Without it the body is a bare flex row, which the chat page
// fills with sidebars and the chat window.
function PageWrapper({ basic = false, className = "", children }) {
    const layout = basic ? "m-auto w-1/2 flex-col justify-center p-space-5" : "";

    return (
        <>
            <Navbar />
            <div className={`flex min-h-0 flex-1 ${layout} ${className}`.trim()}>
                {children}
            </div>
            <Footer />
        </>
    );
}

export default PageWrapper;

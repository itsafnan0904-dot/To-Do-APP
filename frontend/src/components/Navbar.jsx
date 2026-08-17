function Navbar() {
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <h2>Todo App</h2>
            </div>

            <div className="navbar-links">
                <a href="/welcome">Home</a>
                <a href="/dashboard">My Tasks</a>
                <a href="/agent">AI Agent</a>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
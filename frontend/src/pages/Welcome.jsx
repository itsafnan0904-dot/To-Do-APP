import Navbar from "../components/Navbar.jsx";

function Welcome() {
    return (
        <>
            <Navbar />

            <div className="welcome-page">
                <div className="welcome-content">
                    <h1>Welcome to Todo App 👋</h1>

                    <p>
                        Organize your work, manage your tasks,
                        and stay productive.
                    </p>

                    <button
                        onClick={() =>
                            window.location.href = "/dashboard"
                        }
                    >
                        Go to My Tasks
                    </button>
                </div>
            </div>
        </>
    );
}

export default Welcome;
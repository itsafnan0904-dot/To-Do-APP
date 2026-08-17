import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/Welcome";
import Agent from "./pages/Agent";

function App() {
    const path = window.location.pathname;

    if (path === "/signup") {
        return <Signup />;
    }

    if (path === "/dashboard") {
        return <Dashboard />;
    }

    if (path === "/welcome") {
        return <Welcome />;
    }

    if (path === "/agent") {
        return <Agent />;
    }

    return <Login />;
}

export default App;
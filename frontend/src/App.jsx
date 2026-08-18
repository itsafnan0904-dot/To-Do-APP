import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/Welcome";
import Agent from "./pages/Agent";
import ChecklistDetail from "./pages/ChecklistDetail";

function App() {
    const path = window.location.pathname;

    if (path === "/signup") {
        return <Signup />;
    }

    if (path === "/welcome") {
        return <Welcome />;
    }

    if (path === "/dashboard") {
        return <Dashboard />;
    }

    if (path === "/agent") {
        return <Agent />;
    }

    if (path.startsWith("/checklist/")) {
        const id = path.split("/")[2];
        return <ChecklistDetail id={id} />;
    }

    return <Login />;
}

export default App;
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
    const path = window.location.pathname;

    if (path === "/signup") {
        return <Signup />;
    }

    if (path === "/dashboard") {
        return <Dashboard />;
    }

    return <Login />;
}

export default App;
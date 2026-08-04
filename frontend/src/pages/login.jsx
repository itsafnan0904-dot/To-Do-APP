import { useState } from "react";
import axios from "axios";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                formData
            );

            console.log("Login response:", response.data);

            // Save JWT token
            localStorage.setItem(
                "token",
                response.data.token
            );

            console.log(
                "Token saved:",
                localStorage.getItem("token")
            );

            alert("Login successful!");

            // Go to Dashboard
            window.location.href = "/dashboard";

        } catch (error) {
            console.error("Login error:", error);

            alert(
                error.response?.data?.message ||
                "Login failed"
            );
        }
    };

    return (
        <div className="auth-container">
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    Login
                </button>
            </form>

            <p>
                Don't have an account?
            </p>

            <button
                type="button"
                onClick={() => {
                    window.location.href = "/signup";
                }}
            >
                Sign Up
            </button>
        </div>
    );
}

export default Login;
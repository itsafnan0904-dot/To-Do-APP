import { useState } from "react";
import axios from "axios";

function Signup() {
    const [formData, setFormData] = useState({
        name: "",
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
                "http://localhost:5000/api/auth/signup",
                formData
            );

            console.log("Signup response:", response.data);

            alert("Signup successful! Please login.");

            // Go to Login
            window.location.href = "/";

        } catch (error) {
            console.error("Signup error:", error);

            alert(
                error.response?.data?.message ||
                "Signup failed"
            );
        }
    };

    return (
        <div className="auth-container">
            <h1>Create Account</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

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
                    Sign Up
                </button>
            </form>

            <p>
                Already have an account?
            </p>

            <button
                type="button"
                onClick={() => {
                    window.location.href = "/";
                }}
            >
                Login
            </button>
        </div>
    );
}

export default Signup;
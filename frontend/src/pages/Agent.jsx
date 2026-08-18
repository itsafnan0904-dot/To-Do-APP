import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Agent() {
    const [request, setRequest] = useState("");
    const [checklist, setChecklist] = useState([]);

    const handleGenerate = async (e) => {
        e.preventDefault();

        console.log("1. Generate button clicked");
        console.log("2. User request:", request);

        try {
            const token = localStorage.getItem("token");

            console.log("3. Token:", token);

            const response = await axios.post(
                "http://localhost:5000/api/agent",
                {
                    request: request,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("4. Backend response:", response.data);

            setChecklist(response.data.tasks);

        } catch (error) {
            console.error("5. Agent error:", error);
            console.error("6. Server response:", error.response?.data);
        }
    };


    const handleApprove = async () => {
        try {
            const token = localStorage.getItem("token");

            const tasks = checklist.map((task) => task.title || task);

            const response = await axios.post(
                "http://localhost:5000/api/agent/approve",
                {
                    tasks: tasks,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Approval response:", response.data);

            window.alert(
                "Checklist approved! The tasks have been moved to your Todo list."
            );

            window.location.href = "/dashboard";

        } catch (error) {
            console.error("Approve error:", error);
            console.error(
                "Server response:",
                error.response?.data
            );

            window.alert(
                "Failed to approve checklist. Please try again."
            );
        }
    };


    return (
        <div>
            <Navbar />

            <main className="agent-page">
                <div className="agent-container">

                    <h1>AI Checklist Agent</h1>

                    <p className="agent-description">
                        Tell me what you want to accomplish, and I will
                        create a checklist of tasks for you.
                    </p>

                    <form
                        className="agent-form"
                        onSubmit={handleGenerate}
                    >
                        <textarea
                            value={request}
                            onChange={(e) =>
                                setRequest(e.target.value)
                            }
                            placeholder="Example: Create a checklist for launching my website"
                            rows="7"
                        />

                        <button type="submit">
                            Generate Checklist
                        </button>
                    </form>


                    {checklist.length > 0 && (
                        <div className="agent-result">

                            <h2>Generated Checklist</h2>

                            <ul>
                                {checklist.map((task, index) => (
                                    <li key={task._id || index}>
                                        <input type="checkbox" />
                                        <span>
                                            {task.title || task}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleApprove}
                            >
                                Approve Checklist
                            </button>

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default Agent;
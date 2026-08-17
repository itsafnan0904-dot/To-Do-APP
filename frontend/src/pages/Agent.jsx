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
                                    <li key={index}>
                                        <input type="checkbox" />
                                        <span>{task}</span>
                                    </li>
                                ))}
                            </ul>

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default Agent;
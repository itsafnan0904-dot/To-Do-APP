import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function ChecklistDetail({ id }) {
    const [checklist, setChecklist] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        fetchChecklist();
    }, [id]);

    const fetchChecklist = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/";
                return;
            }

            const response = await axios.get(`http://localhost:5000/api/checklists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setChecklist(response.data.checklist);
            setTasks(response.data.checklist.tasks);
            setTitle(response.data.checklist.title);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching checklist:", error);
            if (error.response?.status === 404) {
                alert("Checklist not found");
                window.location.href = "/dashboard";
            }
        }
    };

    const handleSave = async (updatedTasks, updatedTitle = title) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/checklists/${id}`,
                { tasks: updatedTasks, title: updatedTitle },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks(updatedTasks);
            setTitle(updatedTitle);
        } catch (error) {
            console.error("Error saving checklist:", error);
        }
    };

    const handleUpdateTask = (idx) => {
        if (!editValue.trim()) return;
        const newTasks = [...tasks];
        newTasks[idx] = editValue;
        handleSave(newTasks);
        setEditingIdx(null);
    };

    const handleDeleteTask = (idx) => {
        const newTasks = tasks.filter((_, i) => i !== idx);
        handleSave(newTasks);
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        const newTasks = [...tasks, newTask];
        handleSave(newTasks);
        setNewTask("");
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:5000/api/checklists/${id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Checklist approved and tasks moved to your Todos!");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Error approving checklist:", error);
            alert("Failed to approve checklist.");
        }
    };

    const handleDecline = async () => {
        if (!window.confirm("Are you sure you want to discard this checklist?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/checklists/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Error declining checklist:", error);
            alert("Failed to discard checklist.");
        }
    };

    if (loading) return <div><Navbar /><div style={{ padding: '20px' }}>Loading...</div></div>;

    return (
        <div>
            <Navbar />
            <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flexGrow: 1 }}>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => handleSave(tasks, title)}
                            style={{ fontSize: '24px', fontWeight: 'bold', border: '1px solid transparent', padding: '5px', width: '100%', borderRadius: '4px' }}
                            placeholder="Checklist Title"
                        />
                    </div>
                    <div>
                        <button onClick={handleDecline} style={{ backgroundColor: '#dc3545', color: 'white', marginRight: '10px' }}>Decline (Discard)</button>
                        <button onClick={handleApprove} style={{ backgroundColor: '#28a745', color: 'white' }}>Approve Checklist</button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <h3 style={{ marginTop: 0 }}>Review Tasks</h3>
                    
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {tasks.map((task, idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                                {editingIdx === idx ? (
                                    <div style={{ display: 'flex', flexGrow: 1, gap: '10px' }}>
                                        <input 
                                            type="text" 
                                            value={editValue} 
                                            onChange={(e) => setEditValue(e.target.value)}
                                            style={{ flexGrow: 1, padding: '5px' }}
                                        />
                                        <button onClick={() => handleUpdateTask(idx)}>Save</button>
                                        <button onClick={() => setEditingIdx(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ flexGrow: 1 }}>{task}</span>
                                        <div>
                                            <button onClick={() => { setEditingIdx(idx); setEditValue(task); }} style={{ marginRight: '5px' }}>Edit</button>
                                            <button onClick={() => handleDeleteTask(idx)} style={{ backgroundColor: '#dc3545', color: 'white' }}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add another task..."
                            style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button type="submit">Add Task</button>
                    </form>
                </div>
                
                <div style={{ marginTop: '20px' }}>
                    <a href="/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>&larr; Back to Dashboard</a>
                </div>
            </div>
        </div>
    );
}

export default ChecklistDetail;

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
            setTasks(response.data.checklist.tasks || []);
            setTitle(response.data.checklist.title || "");
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
        newTasks[idx] = { ...newTasks[idx], title: editValue.trim() };
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
        const newTasks = [...tasks, { title: newTask.trim(), completed: false }];
        handleSave(newTasks);
        setNewTask("");
    };

    const handleToggleTask = async (taskId, currentStatus) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/checklists/${id}/tasks/${taskId}`,
                { completed: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Optimistic update
            setTasks(tasks.map(t => t._id === taskId ? { ...t, completed: !currentStatus } : t));
        } catch (error) {
            console.error("Error toggling task:", error);
            fetchChecklist();
        }
    };

    const handleMoveUp = (idx) => {
        if (idx === 0) return;
        const newTasks = [...tasks];
        const temp = newTasks[idx];
        newTasks[idx] = newTasks[idx - 1];
        newTasks[idx - 1] = temp;
        handleSave(newTasks);
    };

    const handleMoveDown = (idx) => {
        if (idx === tasks.length - 1) return;
        const newTasks = [...tasks];
        const temp = newTasks[idx];
        newTasks[idx] = newTasks[idx + 1];
        newTasks[idx + 1] = temp;
        handleSave(newTasks);
    };

    const handleDeleteChecklist = async () => {
        if (!window.confirm("Are you sure you want to delete this entire checklist?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/checklists/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Error deleting checklist:", error);
            alert("Failed to delete checklist.");
        }
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="loading-container">Loading...</div>
            </div>
        );
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;

    return (
        <div>
            <Navbar />
            <div className="checklist-detail-container">
                <div className="checklist-detail-header">
                    <div className="checklist-title-wrapper">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => handleSave(tasks, title)}
                            className="checklist-title-input"
                            placeholder="Checklist Title"
                        />
                        <p className="checklist-card-meta">
                            {completedTasks} of {totalTasks} tasks completed
                        </p>
                    </div>
                </div>

                <div className="checklist-tasks-panel">
                    {tasks.length === 0 ? (
                        <p className="checklist-card-meta">No tasks yet. Add one below!</p>
                    ) : (
                        <ul className="checklist-tasks-list">
                            {tasks.map((task, idx) => (
                                <li key={task._id || idx} className="checklist-detail-task-item">
                                    {editingIdx === idx ? (
                                        <div className="edit-container">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateTask(idx)}>Save</button>
                                            <button onClick={() => setEditingIdx(null)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="checklist-task-main">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => handleToggleTask(task._id, task.completed)}
                                                    className="checklist-task-checkbox"
                                                />
                                                <span className={`checklist-task-title ${task.completed ? 'completed' : ''}`}>
                                                    {task.title}
                                                </span>
                                            </div>
                                            <div className="todo-actions">
                                                <button
                                                    onClick={() => { setEditingIdx(idx); setEditValue(task.title); }}
                                                    className="checklist-task-edit-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(idx)}
                                                    className="checklist-task-delete-btn"
                                                >
                                                    ✕
                                                </button>
                                                <button
                                                    onClick={() => handleMoveUp(idx)}
                                                    disabled={idx === 0}
                                                    title="Move Up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(idx)}
                                                    disabled={idx === tasks.length - 1}
                                                    title="Move Down"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <form onSubmit={handleAddTask} className="checklist-detail-add-form">
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="checklist-detail-add-input"
                        />
                        <button type="submit">+ Add Task</button>
                    </form>
                </div>

                <div className="checklist-back-link-wrapper">
                    <a href="/dashboard" className="checklist-back-link">&larr; Back to Dashboard</a>
                </div>
            </div>
        </div>
    );
}

export default ChecklistDetail;

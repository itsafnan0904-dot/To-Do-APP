import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Agent() {
    const [request, setRequest] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! What would you like to accomplish today? I can help you create a checklist." }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [draftChecklists, setDraftChecklists] = useState([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get("http://localhost:5000/api/checklists?status=draft", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDraftChecklists(response.data.checklists || []);
        } catch (error) {
            console.error("Error fetching drafts:", error);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        
        if (!request.trim()) return;

        const newMessages = [...messages, { role: "user", content: request }];
        setMessages(newMessages);
        setRequest("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5000/api/agent",
                { messages: newMessages },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const aiMessage = response.data.message;
            let displayMessage = aiMessage;
            
            const jsonMatch = aiMessage.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
                displayMessage = aiMessage.replace(/```json([\s\S]*?)```/, "").trim();
                if (!displayMessage) {
                    displayMessage = "I've generated a draft checklist! You can review and edit it on the right.";
                }
            }

            setMessages(prev => [...prev, { role: "assistant", content: displayMessage }]);

            if (response.data.checklist) {
                fetchDrafts();
            }

        } catch (error) {
            console.error("Agent error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error communicating with the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Checklist Actions
    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://localhost:5000/api/checklists/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert("Checklist approved! It is now available on your Dashboard.");
            fetchDrafts();
        } catch (error) {
            console.error("Error approving:", error);
            alert("Failed to approve checklist. Please try again.");
        }
    };

    const handleDecline = async (id) => {
        if (!window.confirm("Discard this draft?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/checklists/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchDrafts();
        } catch (error) {
            console.error("Error declining:", error);
        }
    };

    const handleTaskChange = async (checklistId, tasks, newTitle) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/checklists/${checklistId}`, { tasks, title: newTitle }, { headers: { Authorization: `Bearer ${token}` } });
            fetchDrafts();
        } catch (error) {
            console.error("Error updating tasks:", error);
        }
    };

    const handleEditTask = (checklist, taskIndex, newTitle) => {
        const newTasks = [...checklist.tasks];
        newTasks[taskIndex].title = newTitle;
        handleTaskChange(checklist._id, newTasks, checklist.title);
    };

    const handleDeleteTask = (checklist, taskIndex) => {
        const newTasks = checklist.tasks.filter((_, idx) => idx !== taskIndex);
        handleTaskChange(checklist._id, newTasks, checklist.title);
    };

    const handleAddTask = (checklist, title) => {
        const newTasks = [...checklist.tasks, { title, completed: false }];
        handleTaskChange(checklist._id, newTasks, checklist.title);
    };

    const handleMoveDraftUp = (checklist, idx) => {
        if (idx === 0) return;
        const newTasks = [...checklist.tasks];
        const temp = newTasks[idx];
        newTasks[idx] = newTasks[idx - 1];
        newTasks[idx - 1] = temp;
        handleTaskChange(checklist._id, newTasks, checklist.title);
    };

    const handleMoveDraftDown = (checklist, idx) => {
        if (idx === checklist.tasks.length - 1) return;
        const newTasks = [...checklist.tasks];
        const temp = newTasks[idx];
        newTasks[idx] = newTasks[idx + 1];
        newTasks[idx + 1] = temp;
        handleTaskChange(checklist._id, newTasks, checklist.title);
    };

    return (
        <div className="agent-page-wrapper">
            <Navbar />

            <div className="agent-columns-container">
                {/* Chat Column */}
                <div className="agent-chat-column">
                    <h2 className="agent-chat-title">AI Checklist Assistant</h2>
                    
                    <div className="agent-chat-box">
                        {messages.map((msg, idx) => (
                            <div 
                                key={idx} 
                                className={msg.role === 'user' ? 'agent-message-user' : 'agent-message-assistant'}
                            >
                                <span className="agent-message-text">{msg.content}</span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="agent-thinking">
                                <em>Thinking...</em>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleGenerate} className="agent-chat-form">
                        <input
                            type="text"
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            placeholder="Type a message (e.g. 'Plan my gym routine')..."
                            className="agent-chat-input"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !request.trim()} 
                            className="agent-chat-send-btn"
                        >
                            Send
                        </button>
                    </form>
                </div>

                {/* Draft Checklists Column */}
                <div className="agent-drafts-column">
                    <div className="agent-drafts-header">
                        <h2 className="agent-drafts-title">Pending Drafts</h2>
                        <span className="agent-drafts-badge">
                            {draftChecklists.length} Draft{draftChecklists.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    {draftChecklists.length === 0 ? (
                        <div className="agent-drafts-empty">
                            <p className="agent-drafts-empty-title">No draft checklists pending.</p>
                            <p className="agent-drafts-empty-subtitle">Ask the AI assistant on the left to generate one for you!</p>
                        </div>
                    ) : (
                        <div className="agent-drafts-list">
                            {draftChecklists.map(checklist => (
                                <DraftChecklistCard 
                                    key={checklist._id} 
                                    checklist={checklist} 
                                    onApprove={() => handleApprove(checklist._id)}
                                    onDecline={() => handleDecline(checklist._id)}
                                    onEditTask={(idx, title) => handleEditTask(checklist, idx, title)}
                                    onDeleteTask={(idx) => handleDeleteTask(checklist, idx)}
                                    onAddTask={(title) => handleAddTask(checklist, title)}
                                    onMoveUp={(idx) => handleMoveDraftUp(checklist, idx)}
                                    onMoveDown={(idx) => handleMoveDraftDown(checklist, idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DraftChecklistCard({ checklist, onApprove, onDecline, onEditTask, onDeleteTask, onAddTask, onMoveUp, onMoveDown }) {
    const [newTask, setNewTask] = useState("");
    const [editingIdx, setEditingIdx] = useState(null);
    const [editValue, setEditValue] = useState("");

    const submitNewTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        onAddTask(newTask);
        setNewTask("");
    };

    const submitEdit = (idx) => {
        if (!editValue.trim()) return;
        onEditTask(idx, editValue);
        setEditingIdx(null);
    };

    return (
        <div className="draft-card">
            <div className="draft-card-header">
                <h3 className="draft-card-title">{checklist.title}</h3>
                <span className="draft-card-subtitle">{checklist.tasks.length} task{checklist.tasks.length === 1 ? '' : 's'}</span>
            </div>
            
            {/* Task list */}
            <div className="draft-card-tasks">
                <ul className="draft-card-tasks-list">
                    {checklist.tasks.map((task, idx) => (
                        <li key={task._id || idx} className="draft-card-task-item">
                            {editingIdx === idx ? (
                                <div className="draft-task-edit-row">
                                    <input 
                                        value={editValue} 
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="draft-task-edit-input"
                                        autoFocus
                                    />
                                    <button onClick={() => submitEdit(idx)} className="draft-task-save-btn">Save</button>
                                    <button onClick={() => setEditingIdx(null)} className="draft-task-cancel-btn">Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <span className="draft-task-text">{task.title}</span>
                                    <div className="draft-task-actions">
                                        <button 
                                            onClick={() => { setEditingIdx(idx); setEditValue(task.title); }} 
                                            className="draft-task-edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => onDeleteTask(idx)} 
                                            className="draft-task-del-btn"
                                        >
                                            ✕
                                        </button>
                                        <button 
                                            onClick={() => onMoveUp(idx)} 
                                            disabled={idx === 0}
                                            className="draft-task-edit-btn"
                                            title="Move Up"
                                        >
                                            ↑
                                        </button>
                                        <button 
                                            onClick={() => onMoveDown(idx)} 
                                            disabled={idx === checklist.tasks.length - 1}
                                            className="draft-task-edit-btn"
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
            </div>

            <form onSubmit={submitNewTask} className="draft-add-form">
                <input 
                    value={newTask} 
                    onChange={e => setNewTask(e.target.value)} 
                    placeholder="Add custom task..."
                    className="draft-add-input"
                />
                <button type="submit" className="draft-add-btn">Add</button>
            </form>

            <div className="draft-card-actions">
                <button onClick={onDecline} className="btn-decline">
                    Decline
                </button>
                <button onClick={onApprove} className="btn-approve">
                    ✓ Approve Checklist
                </button>
            </div>
        </div>
    );
}

export default Agent;
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [draftChecklists, setDraftChecklists] = useState([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // =========================
  // CHECK LOGIN
  // =========================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
    }
  }, []);

  // =========================
  // GET TODOS
  // =========================

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await axios.get("http://localhost:5000/api/todos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTodos(response.data.todos);
    } catch (error) {
      console.error("Error fetching Todos:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
  };

  const fetchChecklists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:5000/api/checklists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDraftChecklists(response.data.checklists);
    } catch (error) {
      console.error("Error fetching Checklists:", error);
    }
  };

  // Fetch Todos and Checklists when Dashboard loads
  useEffect(() => {
    fetchTodos();
    fetchChecklists();
  }, []);

  // =========================
  // ADD TODO
  // =========================

  const handleAddTodo = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/todos",
        {
          title: title,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTodos([...todos, response.data.todo]);

      setTitle("");
    } catch (error) {
      console.error("Error adding Todo:", error);
    }
  };

  // =========================
  // EDIT TODO
  // =========================

  const handleEditTodo = async (id) => {
    if (!editTitle.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/todos/${id}`,
        {
          title: editTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTodos(
        todos.map((todo) => (todo._id === id ? response.data.todo : todo)),
      );

      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      console.error("Error updating Todo:", error);
    }
  };

  // =========================
  // DELETE TODO
  // =========================

  const handleDeleteTodo = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Todo?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/api/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTodos(todos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Error deleting Todo:", error);
    }
  };

  // =========================
  // COMPLETE / UNCOMPLETE
  // =========================

  const handleToggleTodo = async (id, completed) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/todos/${id}`,
        {
          completed: !completed,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTodos(
        todos.map((todo) => (todo._id === id ? response.data.todo : todo)),
      );
    } catch (error) {
      console.error("Error updating Todo:", error);
    }
  };

  // =========================
  // MOVE UP
  // =========================

  const handleMoveUp = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/todos/${id}/up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchTodos();
    } catch (error) {
      console.error("Error moving Todo up:", error);
    }
  };

  // =========================
  // MOVE DOWN
  // =========================

  const handleMoveDown = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/todos/${id}/down`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchTodos();
    } catch (error) {
      console.error("Error moving Todo down:", error);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");

    window.location.href = "/";
  };

  // =========================
  // DASHBOARD UI
  // =========================

  return (
    <div>
        <Navbar />

        <div className="dashboard-container">

            <div className="dashboard-header">
                <h1>Todo Dashboard</h1>

                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* PENDING CHECKLISTS */}
            {draftChecklists.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2>Pending AI Checklists</h2>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {draftChecklists.map(checklist => (
                            <div 
                                key={checklist._id} 
                                onClick={() => window.location.href = `/checklist/${checklist._id}`}
                                style={{ 
                                    border: '1px solid #ccc', 
                                    borderRadius: '8px', 
                                    padding: '15px', 
                                    width: '300px',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9f9f9',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h3 style={{ margin: '0 0 10px 0' }}>{checklist.title}</h3>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>
                                    {checklist.tasks.length} tasks generated
                                </p>
                                <ul style={{ fontSize: '13px', color: '#444', paddingLeft: '20px', margin: 0 }}>
                                    {checklist.tasks.slice(0, 3).map((task, idx) => (
                                        <li key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {task}
                                        </li>
                                    ))}
                                    {checklist.tasks.length > 3 && <li>...</li>}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ADD TODO */}

            <form onSubmit={handleAddTodo} className="add-todo-form">
                <input
                    type="text"
                    placeholder="Enter a Todo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <button type="submit">Add Todo</button>
            </form>

            {/* SEARCH BAR */}

            <input
                type="text"
                className="search-bar"
                placeholder="Search todos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <h2>My Todos</h2>

            {/* TODO LIST */}

            {todos.length === 0 ? (
                <p>No Todos found.</p>
            ) : (
                <ul className="todo-list">
                    {todos
                        .filter((todo) =>
                            todo.title
                                .toLowerCase()
                                .includes(search.toLowerCase())
                        )
                        .map((todo) => (
                            <li key={todo._id} className="todo-item">

                                {editingId === todo._id ? (

                                    // EDIT MODE

                                    <div className="edit-container">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) =>
                                                setEditTitle(e.target.value)
                                            }
                                        />

                                        <button
                                            onClick={() =>
                                                handleEditTodo(todo._id)
                                            }
                                        >
                                            Save
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditTitle("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                ) : (

                                    // NORMAL MODE

                                    <div className="todo-content">

                                        <div className="todo-info">
                                            <input
                                                type="checkbox"
                                                checked={todo.completed}
                                                onChange={() =>
                                                    handleToggleTodo(
                                                        todo._id,
                                                        todo.completed
                                                    )
                                                }
                                            />

                                            <span
                                                className={
                                                    todo.completed
                                                        ? "completed"
                                                        : ""
                                                }
                                            >
                                                {todo.title}
                                            </span>
                                        </div>

                                        <div className="todo-actions">

                                            <button
                                                onClick={() => {
                                                    setEditingId(todo._id);
                                                    setEditTitle(todo.title);
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDeleteTodo(todo._id)
                                                }
                                            >
                                                Delete
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleMoveUp(todo._id)
                                                }
                                            >
                                                ↑
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleMoveDown(todo._id)
                                                }
                                            >
                                                ↓
                                            </button>

                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                </ul>
            )}

        </div>
    </div>
)};

export default Dashboard;
import Navbar from "../components/Navbar";
import DashboardAgentDrawer from "../components/DashboardAgentDrawer";
import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [approvedChecklists, setApprovedChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  // FETCH CHECKLISTS
  // =========================
  const fetchChecklists = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/checklists?status=approved",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApprovedChecklists(response.data.checklists || []);
    } catch (error) {
      console.error("Error fetching Checklists:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  // =========================
  // CREATE NEW CHECKLIST
  // =========================
  const handleCreateChecklist = async (e) => {
    e.preventDefault();

    if (!newChecklistTitle.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/checklists",
        {
          title: newChecklistTitle.trim(),
          status: "approved",
          tasks: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApprovedChecklists([
        response.data.checklist,
        ...approvedChecklists,
      ]);

      setNewChecklistTitle("");
    } catch (error) {
      console.error("Error creating checklist:", error);

      alert("Failed to create checklist. Please try again.");
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
  // DELETE CHECKLIST
  // =========================
  const handleDeleteChecklist = async (id) => {
    const confirmed = window.confirm(
      "Do you want to delete this checklist?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/checklists/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApprovedChecklists((prev) =>
        prev.filter((checklist) => checklist._id !== id)
      );
    } catch (error) {
      console.error("Error deleting checklist:", error);

      alert("Failed to delete checklist.");
    }
  };

  // =========================
  // TOGGLE ALL TASKS IN CHECKLIST
  // =========================
  const handleToggleAllTasks = async (checklist, currentCompletedState) => {
    if (!checklist.tasks || checklist.tasks.length === 0) return;

    const newTargetState = !currentCompletedState;
    const updatedTasks = checklist.tasks.map((task) => ({
      ...task,
      completed: newTargetState,
    }));

    // Optimistic UI update
    setApprovedChecklists((prev) =>
      prev.map((cl) =>
        cl._id === checklist._id ? { ...cl, tasks: updatedTasks } : cl
      )
    );

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/checklists/${checklist._id}`,
        {
          tasks: updatedTasks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating all checklist tasks:", error);
      // Revert if error
      fetchChecklists();
    }
  };

  // =========================
  // FILTER CHECKLISTS
  // =========================
  const filteredChecklists = approvedChecklists.filter((cl) =>
    cl.title.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div>
      <Navbar />

      <div className="dashboard-container">

        {/* =========================
            DASHBOARD HEADER
        ========================= */}
        <div className="dashboard-header">
          <h1>Checklist Dashboard</h1>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="dashboard-agent-trigger-btn"
              onClick={() => setIsDrawerOpen(true)}
            >
              ✨ AI Assistant
            </button>
            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* =========================
            CREATE CHECKLIST FORM
        ========================= */}
        <form
          onSubmit={handleCreateChecklist}
          className="add-todo-form"
        >
          <input
            type="text"
            placeholder="Create a new checklist title (e.g. Work Project, Grocery, Trip)..."
            value={newChecklistTitle}
            onChange={(e) =>
              setNewChecklistTitle(e.target.value)
            }
          />

          <button type="submit">
            + Create Checklist
          </button>
        </form>

        {/* =========================
            SEARCH BAR
        ========================= */}
        {approvedChecklists.length > 0 && (
          <input
            type="text"
            className="search-bar"
            placeholder="Search checklists..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        )}

        {/* =========================
            CHECKLIST CARDS
        ========================= */}
        <div className="checklists-section">

          <h2>My Checklists</h2>

          {loading ? (
            <p>Loading checklists...</p>
          ) : filteredChecklists.length === 0 ? (
            <p>
              {search
                ? "No checklists match your search."
                : "No checklists yet. Create one above or ask the AI Agent to generate one for you!"}
            </p>
          ) : (
            <div className="checklists-grid">

              {filteredChecklists.map((checklist) => {

                const totalTasks =
                  checklist.tasks?.length || 0;

                const completedTasks =
                  checklist.tasks?.filter(
                    (t) => t.completed
                  ).length || 0;

                const isAllCompleted =
                  totalTasks > 0 && completedTasks === totalTasks;

                return (
                  <div
                    key={checklist._id}
                    className="checklist-wrapper"
                  >

                    {/* =========================
                        CHECKLIST CARD
                    ========================= */}
                    <div
                      onClick={() =>
                      (window.location.href =
                        `/checklist/${checklist._id}`)
                      }
                      className={`checklist-card ${
                        isAllCompleted ? "all-tasks-completed" : ""
                      }`}
                    >

                      <div className="checklist-card-top-row">
                        <input
                          type="checkbox"
                          checked={isAllCompleted}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleAllTasks(checklist, isAllCompleted);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={totalTasks === 0}
                          className="checklist-card-checkbox"
                          title={
                            totalTasks === 0
                              ? "No tasks in checklist"
                              : isAllCompleted
                              ? "Click to uncheck all tasks"
                              : "Click to mark all tasks as completed"
                          }
                        />
                        <h3 className="checklist-card-title">
                          {checklist.title}
                        </h3>
                      </div>

                      <p className="checklist-card-meta">
                        {completedTasks} / {totalTasks} tasks completed
                      </p>

                      {totalTasks === 0 ? (

                        <p className="checklist-card-meta">
                          Empty checklist. Click to add tasks!
                        </p>

                      ) : (

                        <ul className="checklist-preview-list">

                          {checklist.tasks
                            .slice(0, 4)
                            .map((task, idx) => (

                              <li
                                key={task._id || idx}
                                className={`checklist-preview-item ${task.completed
                                    ? "completed"
                                    : ""
                                  }`}
                              >
                                {task.title}
                              </li>

                            ))}

                          {totalTasks > 4 && (
                            <li>...</li>
                          )}

                        </ul>

                      )}

                    </div>

                    {/* =========================
                        DELETE BUTTON
                    ========================= */}
                    <button
                      className="checklist-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleDeleteChecklist(
                          checklist._id
                        );
                      }}
                    >
                      Delete
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>

      {/* Floating Sparkle/Assistant Action Button */}
      <button
        className="dashboard-floating-agent-btn"
        onClick={() => setIsDrawerOpen(prev => !prev)}
        title="Open Dashboard AI Assistant"
        aria-label="Open Dashboard AI Assistant"
      >
        ✨
      </button>

      {/* Slide-Out Side Panel / Drawer */}
      <DashboardAgentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
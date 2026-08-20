import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Checkbox,
  LinearProgress,
  Stack,
  Divider,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";

function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newTask, setNewTask] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [id]);

  const fetchChecklist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/checklists/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setChecklist(response.data.checklist);
      setTasks(response.data.checklist.tasks || []);
      setTitle(response.data.checklist.title || "");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      if (error.response?.status === 404) {
        alert("Checklist not found");
        navigate("/dashboard");
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
      setTasks(
        tasks.map((t) =>
          t._id === taskId ? { ...t, completed: !currentStatus } : t
        )
      );
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
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/checklists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting checklist:", error);
      alert("Failed to delete checklist.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Navbar />
        <Container sx={{ textAlign: "center", py: 10 }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ pt: 4 }}>
        {/* Navigation & Header Bar */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmOpen(true)}
            size="small"
          >
            Delete Checklist
          </Button>
        </Box>

        {/* Main Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {/* Title editing input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSave(tasks, title)}
                InputProps={{
                  disableUnderline: false,
                  sx: {
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    fontWeight: 800,
                  },
                }}
                placeholder="Checklist Title..."
              />

              {/* Progress Summary */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {completedTasks} of {totalTasks} tasks completed
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color={progressPercent === 100 ? "success.main" : "primary.main"}>
                    {progressPercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: progressPercent === 100 ? "#10b981" : "primary.main",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Task List */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {tasks.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  <Typography variant="body1">No tasks in this checklist yet.</Typography>
                  <Typography variant="caption">Add your first task using the form below.</Typography>
                </Box>
              ) : (
                tasks.map((task, idx) => (
                  <Paper
                    key={task._id || idx}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      px: 2,
                      borderRadius: 2.5,
                      border: "1px solid",
                      borderColor: task.completed ? "#bbf7d0" : "divider",
                      bgcolor: task.completed ? "#f0fdf4" : "background.paper",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease-in-out",
                    }}
                  >
                    {editingIdx === idx ? (
                      <Box sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTask(idx);
                          }}
                        />
                        <Button size="small" variant="contained" onClick={() => handleUpdateTask(idx)}>
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditingIdx(null)}>
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, mr: 1 }}>
                          <Checkbox
                            checked={!!task.completed}
                            onChange={() => handleToggleTask(task._id, task.completed)}
                            color="success"
                            sx={{ p: 0.5 }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              textDecoration: task.completed ? "line-through" : "none",
                              color: task.completed ? "text.secondary" : "text.primary",
                              fontWeight: 500,
                              wordBreak: "break-word",
                            }}
                          >
                            {task.title}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingIdx(idx);
                                setEditValue(task.title);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Move Up">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === 0}
                                onClick={() => handleMoveUp(idx)}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Move Down">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === tasks.length - 1}
                                onClick={() => handleMoveDown(idx)}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Delete Task">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTask(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </Paper>
                ))
              )}
            </Stack>

            {/* Add Task Input Form */}
            <Box component="form" onSubmit={handleAddTask} sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Add a new task (e.g. 'Review pull request')..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newTask.trim()}
                sx={{ px: 3, whiteSpace: "nowrap" }}
              >
                Add Task
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Delete Checklist?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this checklist? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteChecklist}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChecklistDetail;

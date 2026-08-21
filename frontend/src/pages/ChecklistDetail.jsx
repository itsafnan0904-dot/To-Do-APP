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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
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
import { getPriorityBadgeProps } from "../utils/priority";

function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [checklistPriority, setChecklistPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
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

      const cl = response.data.checklist;
      setChecklist(cl);
      setTasks(cl.tasks || []);
      setTitle(cl.title || "");
      setChecklistPriority(cl.priority || "medium");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      if (error.response?.status === 404) {
        alert("Checklist not found");
        navigate("/dashboard");
      }
    }
  };

  const handleSave = async (updatedTasks, updatedTitle = title, updatedPriority = checklistPriority) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/checklists/${id}`,
        { tasks: updatedTasks, title: updatedTitle, priority: updatedPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(updatedTasks);
      setTitle(updatedTitle);
      setChecklistPriority(updatedPriority);
    } catch (error) {
      console.error("Error saving checklist:", error);
    }
  };

  const handleChecklistPriorityChange = (newPriority) => {
    setChecklistPriority(newPriority);
    handleSave(tasks, title, newPriority);
  };

  const handleTaskPriorityChange = async (idx, newPriority) => {
    const newTasks = [...tasks];
    newTasks[idx] = { ...newTasks[idx], priority: newPriority };
    setTasks(newTasks);

    const task = newTasks[idx];
    if (task._id) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `http://localhost:5000/api/checklists/${id}/tasks/${task._id}`,
          { priority: newPriority },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Error updating task priority:", err);
      }
    } else {
      handleSave(newTasks);
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
    const newTasks = [
      ...tasks,
      {
        title: newTask.trim(),
        completed: false,
        priority: newTaskPriority || "medium",
      },
    ];
    handleSave(newTasks);
    setNewTask("");
    setNewTaskPriority("medium");
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
  const checklistPriorityProps = getPriorityBadgeProps(checklistPriority);

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
            {/* Header: Title and Checklist Priority Selector */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: 2,
                  mb: 1.5,
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSave(tasks, title, checklistPriority)}
                  InputProps={{
                    disableUnderline: false,
                    sx: {
                      fontSize: { xs: "1.5rem", sm: "1.85rem" },
                      fontWeight: 800,
                    },
                  }}
                  placeholder="Checklist Title..."
                />

                {/* Checklist Priority Dropdown */}
                <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
                  <InputLabel id="checklist-priority-label">Priority</InputLabel>
                  <Select
                    labelId="checklist-priority-label"
                    value={checklistPriority}
                    label="Priority"
                    onChange={(e) => handleChecklistPriorityChange(e.target.value)}
                    renderValue={(val) => {
                      const badge = getPriorityBadgeProps(val);
                      return (
                        <Chip
                          label={badge.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            color: badge.color,
                            bgcolor: badge.bgcolor,
                            border: `1px solid ${badge.border}`,
                          }}
                        />
                      );
                    }}
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>

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
                tasks.map((task, idx) => {
                  const taskPriorityProps = getPriorityBadgeProps(task.priority);

                  return (
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
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                        gap: 1.5,
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, overflow: "hidden" }}>
                            <Checkbox
                              checked={!!task.completed}
                              onChange={() => handleToggleTask(task._id, task.completed)}
                              color="success"
                              sx={{ p: 0.5, flexShrink: 0 }}
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

                          {/* Task Priority Selector Dropdown */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                            <FormControl size="small" sx={{ minWidth: 105 }}>
                              <Select
                                value={task.priority || "medium"}
                                onChange={(e) => handleTaskPriorityChange(idx, e.target.value)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  bgcolor: taskPriorityProps.bgcolor,
                                  color: taskPriorityProps.color,
                                  border: `1px solid ${taskPriorityProps.border}`,
                                  "& .MuiSelect-select": {
                                    py: 0.25,
                                    px: 1,
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    border: "none",
                                  },
                                }}
                              >
                                <MenuItem value="high" sx={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 700 }}>
                                  High
                                </MenuItem>
                                <MenuItem value="medium" sx={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 700 }}>
                                  Medium
                                </MenuItem>
                                <MenuItem value="low" sx={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>
                                  Low
                                </MenuItem>
                              </Select>
                            </FormControl>

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
                  );
                })
              )}
            </Stack>

            {/* Add Task Input Form with Priority Selector */}
            <Box
              component="form"
              onSubmit={handleAddTask}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
              }}
            >
              <TextField
                fullWidth
                size="medium"
                placeholder="Add a new task (e.g. 'Review pull request')..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />

              <FormControl size="medium" sx={{ minWidth: { xs: "100%", sm: 130 }, flexShrink: 0 }}>
                <InputLabel id="new-task-priority-label">Priority</InputLabel>
                <Select
                  labelId="new-task-priority-label"
                  value={newTaskPriority}
                  label="Priority"
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newTask.trim()}
                sx={{ px: 3, whiteSpace: "nowrap", flexShrink: 0 }}
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

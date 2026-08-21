import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  TextField,
  Button,
  IconButton,
  Checkbox,
  LinearProgress,
  InputAdornment,
  CircularProgress,
  Chip,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ListAlt as ListAltIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { getPriorityBadgeProps } from "../utils/priority";

function Dashboard() {
  const navigate = useNavigate();
  const [approvedChecklists, setApprovedChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistPriority, setNewChecklistPriority] = useState("medium");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "in-progress", "empty"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all", "high", "medium", "low"
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
        navigate("/");
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
    if (e) e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/checklists",
        {
          title: newChecklistTitle.trim(),
          priority: newChecklistPriority || "medium",
          status: "approved",
          tasks: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApprovedChecklists([response.data.checklist, ...approvedChecklists]);
      setNewChecklistTitle("");
      setNewChecklistPriority("medium");
      setOpenCreateModal(false);
    } catch (error) {
      console.error("Error creating checklist:", error);
      alert("Failed to create checklist. Please try again.");
    }
  };

  // =========================
  // DELETE CHECKLIST
  // =========================
  const handleDeleteChecklist = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/checklists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApprovedChecklists((prev) =>
        prev.filter((checklist) => checklist._id !== id)
      );
      setDeleteConfirmId(null);
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
      fetchChecklists();
    }
  };

  // =========================
  // STATS CALCULATIONS
  // =========================
  const totalAllTasks = approvedChecklists.reduce(
    (acc, cl) => acc + (cl.tasks?.length || 0),
    0
  );
  const completedAllTasks = approvedChecklists.reduce(
    (acc, cl) =>
      acc + (cl.tasks?.filter((t) => t.completed).length || 0),
    0
  );
  const overallPercentage =
    totalAllTasks > 0
      ? Math.round((completedAllTasks / totalAllTasks) * 100)
      : 0;

  // =========================
  // CLIENT-SIDE SEARCH, STATUS & PRIORITY FILTERING
  // =========================
  const filteredChecklists = approvedChecklists.filter((cl) => {
    const query = search.toLowerCase().trim();
    const matchesTitle = cl.title.toLowerCase().includes(query);
    const matchesAnyTask = cl.tasks?.some((t) =>
      t.title.toLowerCase().includes(query)
    );
    const matchesSearch = !query || matchesTitle || matchesAnyTask;

    const totalTasks = cl.tasks?.length || 0;
    const completedTasks = cl.tasks?.filter((t) => t.completed).length || 0;
    const isCompleted = totalTasks > 0 && completedTasks === totalTasks;
    const isInProgress = totalTasks > 0 && completedTasks < totalTasks;
    const isEmpty = totalTasks === 0;

    let matchesStatus = true;
    if (statusFilter === "completed") matchesStatus = isCompleted;
    if (statusFilter === "in-progress") matchesStatus = isInProgress;
    if (statusFilter === "empty") matchesStatus = isEmpty;

    let matchesPriority = true;
    if (priorityFilter !== "all") {
      const clPriority = (cl.priority || "medium").toLowerCase();
      matchesPriority = clPriority === priorityFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Top Hero Container with Vibrant Gradient */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: "24px",
            background: "linear-gradient(90deg, #5B42F3 0%, #7c3aed 45%, #db2777 80%, #EF233C 100%)",
            color: "white",
            mb: 4,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(91, 66, 243, 0.28)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Left Side Content (Title, Subtitle & Action) */}
            <Grid item xs={12} md={7}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
                  fontWeight: 800,
                  color: "white",
                  mb: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                Workspace Dashboard 🚀
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: { xs: "0.875rem", sm: "0.95rem" },
                  maxWidth: 540,
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Organize your work streams, monitor task completion, and harness AI to draft customized workflows.
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateModal(true)}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#4f46e5",
                    fontWeight: 700,
                    borderRadius: "50px",
                    px: 3.5,
                    py: 1.2,
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                      color: "#4338ca",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  New Checklist
                </Button>
              </Box>
            </Grid>

            {/* Embedded Right Metrics Card (Overall Completion Widget) */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "20px",
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 800,
                    color: "rgba(255, 255, 255, 0.75)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    mb: 1.5,
                  }}
                >
                  OVERALL COMPLETION
                </Typography>

                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: "white",
                      fontSize: { xs: "2.25rem", sm: "2.75rem" },
                      lineHeight: 1,
                    }}
                  >
                    {overallPercentage}%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.85)",
                      fontWeight: 500,
                    }}
                  >
                    ({completedAllTasks} of {totalAllTasks} tasks finished)
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={overallPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(255, 255, 255, 0.25)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#10B981",
                      borderRadius: 4,
                    },
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Filter / Search Bar (Search + Status + Priority Filter) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Text search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search checklists or tasks (e.g. 'work', 'groceries', 'review')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
            <InputLabel id="filter-status-label">Status</InputLabel>
            <Select
              labelId="filter-status-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="empty">Empty</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
            <InputLabel id="filter-priority-label">Priority</InputLabel>
            <Select
              labelId="filter-priority-label"
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="low">Low Priority</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Checklists Grid with Identical-Size Cards */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredChecklists.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 4,
              border: "2px dashed",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <ListAltIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {search || statusFilter !== "all" || priorityFilter !== "all"
                ? "No checklists match your search/filter."
                : "No checklists created yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 3 }}>
              {search || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try clearing your search query or reset the filters."
                : "Get started by creating your first checklist above!"}
            </Typography>
            {search || statusFilter !== "all" || priorityFilter !== "all" ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
              >
                Create Checklist
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredChecklists.map((checklist) => (
              <Grid item xs={12} sm={6} md={4} key={checklist._id}>
                <DashboardChecklistCard
                  checklist={checklist}
                  onToggleAllTasks={handleToggleAllTasks}
                  onDelete={(id) => setDeleteConfirmId(id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create Checklist Dialog with Low/Medium/High Priority Selector */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Create New Checklist</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Give your new checklist a clear title and assign a priority level.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              autoFocus
              fullWidth
              label="Checklist Title"
              placeholder="e.g. Sprint Launch, Groceries, Trip Packing..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChecklist();
              }}
            />

            <FormControl fullWidth>
              <InputLabel id="create-priority-label">Priority Level</InputLabel>
              <Select
                labelId="create-priority-label"
                value={newChecklistPriority}
                label="Priority Level"
                onChange={(e) => setNewChecklistPriority(e.target.value)}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium (Default)</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreateModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateChecklist}
            disabled={!newChecklistTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Delete Checklist?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this checklist? All associated tasks will be removed permanently.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirmId(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteChecklist(deleteConfirmId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// INDIVIDUAL CHECKLIST CARD WITH LOCAL TASK FILTERING
// Strictly equal dimensions (height: 380px) regardless of task count or filters
// ============================================================
function DashboardChecklistCard({ checklist, onToggleAllTasks, onDelete }) {
  const navigate = useNavigate();
  const [taskStatusFilter, setTaskStatusFilter] = useState("all"); // "all", "completed", "incomplete"
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all"); // "all", "high", "medium", "low"

  const totalTasks = checklist.tasks?.length || 0;
  const completedTasks =
    checklist.tasks?.filter((t) => t.completed).length || 0;
  const isAllCompleted =
    totalTasks > 0 && completedTasks === totalTasks;
  const progressPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
  const priorityProps = getPriorityBadgeProps(checklist.priority);

  // Independent card-level task filtering logic
  const filteredTasks = (checklist.tasks || []).filter((task) => {
    // 1. Completion filter
    if (taskStatusFilter === "completed" && !task.completed) return false;
    if (taskStatusFilter === "incomplete" && task.completed) return false;

    // 2. Priority filter
    if (taskPriorityFilter !== "all") {
      const p = (task.priority || "medium").toLowerCase();
      if (p !== taskPriorityFilter.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <Card
      elevation={0}
      sx={{
        height: 380,
        minHeight: 380,
        maxHeight: 380,
        display: "flex",
        flexDirection: "column",
        borderRadius: 3.5,
        border: "1px solid",
        borderColor: isAllCompleted ? "success.light" : "divider",
        transition: "all 0.2s ease-in-out",
        bgcolor: isAllCompleted ? "#f0fdf4" : "background.paper",
        boxSizing: "border-box",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 24px -5px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* Top Clickable Content Area */}
      <Box
        onClick={() => navigate(`/checklist/${checklist._id}`)}
        sx={{
          p: 2.5,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* 1. Header Row (Fixed Height: 36px) */}
        <Box
          sx={{
            height: 36,
            minHeight: 36,
            maxHeight: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 1.25,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              flexGrow: 1,
              overflow: "hidden",
            }}
          >
            <Checkbox
              checked={isAllCompleted}
              disabled={totalTasks === 0}
              onChange={(e) => {
                e.stopPropagation();
                onToggleAllTasks(checklist, isAllCompleted);
              }}
              onClick={(e) => e.stopPropagation()}
              color="success"
              size="small"
              sx={{ p: 0.5, flexShrink: 0 }}
            />
            <Typography
              variant="h6"
              fontWeight={700}
              noWrap
              title={checklist.title}
              sx={{
                fontSize: "1.05rem",
                textDecoration: isAllCompleted ? "line-through" : "none",
                color: isAllCompleted ? "text.secondary" : "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {checklist.title}
            </Typography>
          </Box>

          {/* Priority Badge */}
          <Chip
            label={priorityProps.label}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              height: 22,
              color: priorityProps.color,
              bgcolor: priorityProps.bgcolor,
              border: `1px solid ${priorityProps.border}`,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* 2. Progress Meta Section (Fixed Height: 36px) */}
        <Box
          sx={{
            height: 36,
            minHeight: 36,
            maxHeight: 36,
            mb: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {completedTasks} / {totalTasks} Tasks Completed
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              color={isAllCompleted ? "success.main" : "primary.main"}
            >
              {progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: isAllCompleted ? "#bbf7d0" : "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                bgcolor: isAllCompleted ? "#10b981" : "primary.main",
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* 3. Card-Level Task Filter Controls (Fixed Height: 34px) */}
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            height: 34,
            minHeight: 34,
            maxHeight: 34,
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
            <Select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              sx={{
                height: 28,
                fontSize: "0.75rem",
                bgcolor: "background.paper",
                "& .MuiSelect-select": { py: 0.25, px: 1 },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.78rem" }}>All Status</MenuItem>
              <MenuItem value="incomplete" sx={{ fontSize: "0.78rem" }}>Incomplete</MenuItem>
              <MenuItem value="completed" sx={{ fontSize: "0.78rem" }}>Completed</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl size="small" sx={{ minWidth: 0, flex: 1 }}>
            <Select
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value)}
              sx={{
                height: 28,
                fontSize: "0.75rem",
                bgcolor: "background.paper",
                "& .MuiSelect-select": { py: 0.25, px: 1 },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.78rem" }}>All Priority</MenuItem>
              <MenuItem value="high" sx={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 700 }}>High</MenuItem>
              <MenuItem value="medium" sx={{ fontSize: "0.78rem", color: "#d97706", fontWeight: 700 }}>Medium</MenuItem>
              <MenuItem value="low" sx={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 700 }}>Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 4. Task Preview Area (Strict Fixed Height: 115px with internal scroll) */}
        <Box
          sx={{
            height: 115,
            minHeight: 115,
            maxHeight: 115,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 0.5,
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {totalTasks === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                textAlign: "center",
                bgcolor: "rgba(0,0,0,0.01)",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: "0.85rem" }}>
                No tasks yet. Click to add.
              </Typography>
            </Box>
          ) : filteredTasks.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                textAlign: "center",
                bgcolor: "rgba(0,0,0,0.01)",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: "0.82rem" }}>
                No tasks match these filters.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.75}>
              {filteredTasks.map((task, idx) => {
                const taskPriority = getPriorityBadgeProps(task.priority);
                return (
                  <Box
                    key={task._id || idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      fontSize: "0.85rem",
                      color: task.completed ? "text.secondary" : "text.primary",
                      textDecoration: task.completed ? "line-through" : "none",
                      minWidth: 0,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexGrow: 1, overflow: "hidden" }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: task.completed ? "success.main" : taskPriority.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        noWrap
                        title={task.title}
                        sx={{
                          fontSize: "0.85rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: taskPriority.color,
                        bgcolor: taskPriority.bgcolor,
                        px: 0.75,
                        py: 0.1,
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    >
                      {taskPriority.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* 5. Card Footer Actions (Strict Fixed Height: 52px at bottom) */}
      <Box
        sx={{
          p: 1.25,
          px: 2.5,
          height: 52,
          minHeight: 52,
          maxHeight: 52,
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: isAllCompleted ? "#dcfce7" : "divider",
          bgcolor: "background.paper",
          mt: "auto",
        }}
      >
        <Button
          size="small"
          color="primary"
          onClick={() => navigate(`/checklist/${checklist._id}`)}
          sx={{ fontWeight: 600 }}
        >
          Manage
        </Button>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(checklist._id);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}

export default Dashboard;
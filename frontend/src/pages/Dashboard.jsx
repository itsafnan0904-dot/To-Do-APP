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

function Dashboard() {
  const navigate = useNavigate();
  const [approvedChecklists, setApprovedChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "in-progress", "empty"
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
  // PURE CLIENT-SIDE SEARCH & STATUS FILTERING (NO AI)
  // Matches query against checklist title OR individual task titles
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

    return matchesSearch && matchesStatus;
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

        {/* Filter / Search Bar (Pure Search & Filter with NO AI) */}
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
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 2,
          }}
        >
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

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel id="filter-status-label">Filter by Status</InputLabel>
            <Select
              labelId="filter-status-label"
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Checklists</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="empty">Empty</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Checklists Grid */}
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
              {search || statusFilter !== "all"
                ? "No checklists match your search/filter."
                : "No checklists created yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 3 }}>
              {search || statusFilter !== "all"
                ? "Try clearing your search query or reset the status filter."
                : "Get started by creating your first checklist above!"}
            </Typography>
            {search || statusFilter !== "all" ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
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
            {filteredChecklists.map((checklist) => {
              const totalTasks = checklist.tasks?.length || 0;
              const completedTasks =
                checklist.tasks?.filter((t) => t.completed).length || 0;
              const isAllCompleted =
                totalTasks > 0 && completedTasks === totalTasks;
              const progressPercentage =
                totalTasks > 0
                  ? Math.round((completedTasks / totalTasks) * 100)
                  : 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={checklist._id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 3.5,
                      border: "1px solid",
                      borderColor: isAllCompleted ? "success.light" : "divider",
                      transition: "all 0.2s ease-in-out",
                      bgcolor: isAllCompleted ? "#f0fdf4" : "background.paper",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 12px 24px -5px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/checklist/${checklist._id}`)}
                      sx={{
                        flexGrow: 1,
                        p: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                      }}
                    >
                      {/* Top Row */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          mb: 1.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Checkbox
                            checked={isAllCompleted}
                            disabled={totalTasks === 0}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleAllTasks(checklist, isAllCompleted);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            color="success"
                            sx={{ p: 0.5 }}
                          />
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                              textDecoration: isAllCompleted ? "line-through" : "none",
                              color: isAllCompleted ? "text.secondary" : "text.primary",
                              wordBreak: "break-word",
                            }}
                          >
                            {checklist.title}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress Meta */}
                      <Box sx={{ mb: 2 }}>
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

                      {/* Task preview items */}
                      <Box sx={{ flexGrow: 1, mb: 1 }}>
                        {totalTasks === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                            Empty checklist. Click to add tasks.
                          </Typography>
                        ) : (
                          <Stack spacing={0.75}>
                            {checklist.tasks.slice(0, 3).map((task, idx) => (
                              <Box
                                key={task._id || idx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  fontSize: "0.85rem",
                                  color: task.completed ? "text.secondary" : "text.primary",
                                  textDecoration: task.completed ? "line-through" : "none",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    bgcolor: task.completed ? "success.main" : "primary.light",
                                  }}
                                />
                                <Typography variant="body2" noWrap sx={{ fontSize: "0.875rem" }}>
                                  {task.title}
                                </Typography>
                              </Box>
                            ))}
                            {totalTasks > 3 && (
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                + {totalTasks - 3} more items...
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Box>
                    </CardActionArea>

                    {/* Card Footer Actions */}
                    <Box
                      sx={{
                        p: 1.5,
                        px: 2.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid",
                        borderColor: isAllCompleted ? "#dcfce7" : "divider",
                      }}
                    >
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/checklist/${checklist._id}`)}
                      >
                        Manage
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(checklist._id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Create Checklist Dialog */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Create New Checklist</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Give your new checklist a clear title (e.g., "Marketing Sprint", "Grocery List", "Study Plan").
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Checklist Title"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateChecklist();
            }}
          />
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

export default Dashboard;
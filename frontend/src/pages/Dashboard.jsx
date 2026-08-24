import Navbar from "../components/Navbar";
import { useEffect, useState, useMemo } from "react";
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
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ListAlt as ListAltIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { getPriorityBadgeProps } from "../utils/priority";

const MOTIVATIONAL_QUOTES = [
  {
    quote: "Simplicity is the soul of efficiency.",
    author: "Austin Freeman",
  },
  {
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
  },
  {
    quote: "Code is like humor. When you have to explain it, it’s bad.",
    author: "Cory House",
  },
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
  {
    quote: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
  {
    quote: "Experience is the name everyone gives to their mistakes.",
    author: "Oscar Wilde",
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
  {
    quote: "Continuous improvement is better than delayed perfection.",
    author: "Mark Twain",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
];

const getAIInsight = (checklists) => {
  const safeChecklists = checklists || [];
  const allTasks = safeChecklists.flatMap((cl) => cl?.tasks || []);
  const totalTasks = allTasks.length;

  if (totalTasks === 0) {
    return "Tip: Start by adding your first task and build momentum from there.";
  }

  const completedCount = allTasks.filter((t) => t?.completed).length;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // RULE 1 — 0% COMPLETION
  if (completedCount === 0) {
    const hasHighPriority = allTasks.some(
      (t) => (t?.priority || "").toLowerCase() === "high"
    );
    if (hasHighPriority) {
      return "Tip: Select one High-Priority task and focus on completing it first to build momentum.";
    }
    return "Tip: Select one important task and focus on completing it first to build momentum.";
  }

  // RULE 2 — HIGH PRIORITY TASKS > 50%
  const tasksWithPriority = allTasks.filter((t) => t?.priority);
  if (tasksWithPriority.length > 0) {
    const highPriorityCount = allTasks.filter(
      (t) => (t?.priority || "").toLowerCase() === "high"
    ).length;
    if (highPriorityCount / totalTasks > 0.5) {
      return "Caution: Over half your tasks are marked High Priority. Consider downgrading non-urgent items.";
    }
  }

  // RULE 3 — COMPLETION > 70%
  if (completionRate > 70) {
    return "Great velocity! You're close to closing out your active work streams.";
  }

  // RULE 4 — DEFAULT
  return "Tip: Group similar tasks together into focused 25-minute work blocks.";
};

function Dashboard() {
  const navigate = useNavigate();
  const [approvedChecklists, setApprovedChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistPriority, setNewChecklistPriority] = useState("medium");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "in-progress", "yet-to-start", "completed", "high-priority"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "completed"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all", "high", "medium", "low"
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Quote State & Rotation
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  // Quote change transition logic (fade-out -> change index -> fade-in)
  const changeQuoteWithFade = () => {
    setIsQuoteVisible(false);
    setTimeout(() => {
      setQuoteIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        } while (nextIndex === prevIndex && MOTIVATIONAL_QUOTES.length > 1);
        return nextIndex;
      });
      setIsQuoteVisible(true);
    }, 300);
  };

  // Automatic 15-second rotation with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      changeQuoteWithFade();
    }, 15000);

    return () => clearInterval(interval);
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
  // DYNAMIC TAB COUNTS & COMPLETION CALCULATIONS
  // =========================
  const getChecklistCompletionPercentage = (cl) => {
    const total = cl.tasks?.length || 0;
    if (total === 0) return 0;
    const completed = cl.tasks.filter((t) => t.completed).length;
    return Math.round((completed / total) * 100);
  };

  const tabCounts = useMemo(() => {
    const counts = {
      all: approvedChecklists.length,
      inProgress: 0,
      yetToStart: 0,
      completed: 0,
      highPriority: 0,
    };

    approvedChecklists.forEach((cl) => {
      const pct = getChecklistCompletionPercentage(cl);
      if (pct > 0 && pct < 100) {
        counts.inProgress += 1;
      } else if (pct === 0) {
        counts.yetToStart += 1;
      } else if (pct === 100) {
        counts.completed += 1;
      }

      if ((cl.priority || "medium").toLowerCase() === "high") {
        counts.highPriority += 1;
      }
    });

    return counts;
  }, [approvedChecklists]);

  // =========================
  // MULTI-LAYER FILTERING PIPELINE (useMemo)
  // Layer 1: Active Tab → Layer 2: Search → Layer 3: Status Filter → Layer 4: Priority Filter
  // =========================
  const filteredChecklists = useMemo(() => {
    return approvedChecklists
      // Layer 1: Active Tab Filter
      .filter((cl) => {
        if (activeTab === "all") return true;

        const pct = getChecklistCompletionPercentage(cl);
        if (activeTab === "in-progress") return pct > 0 && pct < 100;
        if (activeTab === "yet-to-start") return pct === 0;
        if (activeTab === "completed") return pct === 100;
        if (activeTab === "high-priority")
          return (cl.priority || "medium").toLowerCase() === "high";

        return true;
      })
      // Layer 2: Search Bar Filter (matches title or any task title)
      .filter((cl) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;

        const matchesTitle = (cl.title || "").toLowerCase().includes(query);
        const matchesAnyTask = (cl.tasks || []).some((t) =>
          (t.title || "").toLowerCase().includes(query)
        );

        return matchesTitle || matchesAnyTask;
      })
      // Layer 3: Global Status Filter
      .filter((cl) => {
        if (statusFilter === "all") return true;

        const allTasks = cl.tasks || [];
        if (statusFilter === "pending") {
          const hasPendingTasks = allTasks.some((t) => !t.completed);
          if (allTasks.length > 0 && !hasPendingTasks) return false;
        } else if (statusFilter === "completed") {
          const total = allTasks.length;
          const completed = allTasks.filter((t) => t.completed).length;
          if (total === 0 || completed < total) return false;
        }

        return true;
      })
      // Layer 4: Global Priority Filter
      .filter((cl) => {
        if (priorityFilter === "all") return true;
        return (cl.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      });
  }, [approvedChecklists, activeTab, search, statusFilter, priorityFilter]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Top Hero Container with Vibrant Gradient */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
            borderRadius: "24px",
            background: "linear-gradient(90deg, #5B42F3 0%, #7c3aed 45%, #db2777 80%, #EF233C 100%)",
            color: "white",
            mb: 4,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(91, 66, 243, 0.28)",
          }}
        >
          {/* Hero Header Area: Title, Description & Action Button */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
                  fontWeight: 800,
                  color: "white",
                  mb: 0.75,
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
                  maxWidth: 600,
                  lineHeight: 1.5,
                }}
              >
                Organize your work streams, monitor task completion, and harness AI to draft customized workflows.
              </Typography>
            </Box>

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
                whiteSpace: "nowrap",
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

          {/* 3-Column Glassmorphic Cards Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {/* 1. Overall Completion Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.7)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    mb: 1,
                  }}
                >
                  OVERALL COMPLETION
                </Typography>

                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1.5 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: "white",
                      fontSize: { xs: "2rem", sm: "2.25rem" },
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
                      fontSize: "0.85rem",
                    }}
                  >
                    ({completedAllTasks} of {totalAllTasks} tasks finished)
                  </Typography>
                </Box>
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

            {/* 2. Daily Inspiration Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Header with Title */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.7)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  DAILY INSPIRATION ✨
                </Typography>
              </Box>

              {/* Quote Text & Author with Smooth Fade Transition */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  my: 0.5,
                  opacity: isQuoteVisible ? 1 : 0,
                  transition: "opacity 300ms ease-in-out",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: "italic",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.95)",
                    lineHeight: 1.4,
                    mb: 0.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  "{MOTIVATIONAL_QUOTES[quoteIndex]?.quote}"
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  — {MOTIVATIONAL_QUOTES[quoteIndex]?.author}
                </Typography>
              </Box>
            </Paper>

            {/* 3. AI Productivity Insight Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "16px",
                bgcolor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Header with Title */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.7)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  AI INSIGHT 🧠
                </Typography>
              </Box>

              {/* Insight Text */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  my: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: "italic",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.95)",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  "{getAIInsight(approvedChecklists)}"
                </Typography>
              </Box>

              {/* Action Button */}
              <Box sx={{ pt: 0.5 }}>
                <Button
                  size="small"
                  onClick={() => navigate("/agent")}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    backdropFilter: "blur(5px)",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    py: 0.4,
                    px: 1.5,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  }}
                >
                  ✨ Ask AI Coach
                </Button>
              </Box>
            </Paper>
          </Box>
        </Paper>

        {/* Global Search & Filter Bar Row */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            my: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* 1. Main Search Bar (Flexible Growth) */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search checklists or tasks (e.g. 'work', 'groceries', 'review')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: "100%", md: 240 } }}
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

          {/* 2. Global Filter Dropdowns Container */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
              width: { xs: "100%", md: "auto" },
            }}
          >
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 145, flex: { xs: 1, sm: "initial" } }}>
              <InputLabel id="filter-status-label">Status</InputLabel>
              <Select
                labelId="filter-status-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl size="small" sx={{ minWidth: 155, flex: { xs: 1, sm: "initial" } }}>
              <InputLabel id="filter-priority-label">Priority</InputLabel>
              <Select
                labelId="filter-priority-label"
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high" sx={{ color: "#dc2626", fontWeight: 600 }}>High</MenuItem>
                <MenuItem value="medium" sx={{ color: "#d97706", fontWeight: 600 }}>Medium</MenuItem>
                <MenuItem value="low" sx={{ color: "#2563eb", fontWeight: 600 }}>Low</MenuItem>
              </Select>
            </FormControl>

            {(search || statusFilter !== "all" || priorityFilter !== "all") && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                sx={{ textTransform: "none", fontWeight: 600, height: 38 }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Paper>

        {/* Tab Navigation System (Active Tab Filter with Dynamic Badges) */}
        <Box sx={{ mb: 4, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          {[
            { key: "all", label: "All", count: tabCounts.all },
            { key: "in-progress", label: "In Progress", count: tabCounts.inProgress },
            { key: "yet-to-start", label: "Yet to Start", count: tabCounts.yetToStart },
            { key: "completed", label: "Completed", count: tabCounts.completed },
            { key: "high-priority", label: "🔥 High Priority", count: tabCounts.highPriority },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                disableElevation
                sx={{
                  borderRadius: "24px",
                  px: 2.2,
                  py: 0.8,
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 500,
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  bgcolor: isActive
                    ? "primary.main"
                    : "background.paper",
                  color: isActive ? "#ffffff" : "text.secondary",
                  border: "1px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(91, 66, 243, 0.25)"
                    : "none",
                  "&:hover": {
                    bgcolor: isActive ? "primary.dark" : "rgba(0, 0, 0, 0.04)",
                    borderColor: isActive ? "primary.dark" : "divider",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>{tab.label}</span>
                  <Chip
                    size="small"
                    label={tab.count}
                    sx={{
                      height: 20,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      bgcolor: isActive
                        ? "rgba(255, 255, 255, 0.25)"
                        : "rgba(0, 0, 0, 0.06)",
                      color: isActive ? "#ffffff" : "text.primary",
                      borderRadius: "10px",
                      px: 0.2,
                    }}
                  />
                </Box>
              </Button>
            );
          })}
        </Box>

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
              {search || statusFilter !== "all" || priorityFilter !== "all" || activeTab !== "all"
                ? "No tasks or checklists match the selected filters."
                : "No checklists created yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 3 }}>
              {search || statusFilter !== "all" || priorityFilter !== "all" || activeTab !== "all"
                ? "Try adjusting your search query, active tab, or filters to view more items."
                : "Get started by creating your first checklist above!"}
            </Typography>
            {search || statusFilter !== "all" || priorityFilter !== "all" || activeTab !== "all" ? (
              <Button
                variant="contained"
                onClick={() => {
                  setSearch("");
                  setActiveTab("all");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear Filters
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
// INDIVIDUAL CHECKLIST CARD (WITHOUT INTERNAL DROPDOWNS)
// Strictly equal dimensions (height: 380px) regardless of task count or filters
// ============================================================
function DashboardChecklistCard({ checklist, onToggleAllTasks, onDelete }) {
  const navigate = useNavigate();

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

  const tasksToRender = checklist.tasks || [];

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

        {/* 3. Task Preview Area (Expanded Height: 155px with internal scroll) */}
        <Box
          sx={{
            height: 155,
            minHeight: 155,
            maxHeight: 155,
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
          ) : tasksToRender.length === 0 ? (
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
                No matching tasks.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.75}>
              {tasksToRender.map((task, idx) => {
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

      {/* 4. Card Footer Actions (Strict Fixed Height: 52px at bottom) */}
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
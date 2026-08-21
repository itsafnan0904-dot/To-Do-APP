import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon,
  ListAlt as ListAltIcon,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import { getPriorityBadgeProps } from "../utils/priority";

function Agent() {
  const navigate = useNavigate();
  const [request, setRequest] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! What would you like to accomplish today? Tell me what you're planning (e.g. *'Prep for a software job interview'* or *'30-day workout routine'*), and I will structure a ready-to-use draft checklist for you!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [draftChecklists, setDraftChecklists] = useState([]);

  // Dedicated ref to scroll only the chat messages box
  const chatScrollContainerRef = useRef(null);
  // Dedicated ref for draft container to scroll when a checklist is generated
  const draftsScrollContainerRef = useRef(null);

  const scrollChatToBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop =
        chatScrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollChatToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(
        "http://localhost:5000/api/checklists?status=draft",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

      const aiMessage = response.data.message || "";
      let displayMessage = aiMessage;

      // Extract JSON if present and remove raw json code block from the message bubble
      const jsonMatch =
        aiMessage.match(/```json\s*([\s\S]*?)\s*```/) ||
        aiMessage.match(/```\s*(\{[\s\S]*?\})\s*```/);

      if (jsonMatch) {
        displayMessage = aiMessage
          .replace(/```json\s*[\s\S]*?\s*```/, "")
          .replace(/```\s*\{[\s\S]*?\}\s*```/, "")
          .trim();

        if (!displayMessage) {
          displayMessage =
            "I've generated a draft checklist! Your new checklist is ready in the **Pending Drafts** section on the right. You can review, edit, or approve it whenever you're ready.";
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: displayMessage },
      ]);

      if (response.data.checklist) {
        await fetchDrafts();
        // Scroll the pending drafts column into view when a checklist is made
        if (draftsScrollContainerRef.current) {
          draftsScrollContainerRef.current.scrollTop = 0;
        }
      }
    } catch (error) {
      console.error("Agent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error communicating with the server. Please verify the backend connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Checklist Actions
  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/checklists/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDrafts();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve checklist. Please try again.");
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm("Discard this draft checklist?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/checklists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDrafts();
    } catch (error) {
      console.error("Error declining:", error);
    }
  };

  const handleTaskChange = async (checklistId, tasks, newTitle, newPriority) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/checklists/${checklistId}`,
        { tasks, title: newTitle, priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDrafts();
    } catch (error) {
      console.error("Error updating tasks:", error);
    }
  };

  const handleEditTask = (checklist, taskIndex, newTitle, newPriority) => {
    const newTasks = [...checklist.tasks];
    newTasks[taskIndex].title = newTitle;
    if (newPriority) newTasks[taskIndex].priority = newPriority;
    handleTaskChange(checklist._id, newTasks, checklist.title, checklist.priority);
  };

  const handleDeleteTask = (checklist, taskIndex) => {
    const newTasks = checklist.tasks.filter((_, idx) => idx !== taskIndex);
    handleTaskChange(checklist._id, newTasks, checklist.title, checklist.priority);
  };

  const handleAddTask = (checklist, title, priority = "medium") => {
    const newTasks = [...checklist.tasks, { title, completed: false, priority }];
    handleTaskChange(checklist._id, newTasks, checklist.title, checklist.priority);
  };

  const handleChecklistPriorityChange = (checklist, newPriority) => {
    handleTaskChange(checklist._id, checklist.tasks, checklist.title, newPriority);
  };

  const handleMoveDraftUp = (checklist, idx) => {
    if (idx === 0) return;
    const newTasks = [...checklist.tasks];
    const temp = newTasks[idx];
    newTasks[idx] = newTasks[idx - 1];
    newTasks[idx - 1] = temp;
    handleTaskChange(checklist._id, newTasks, checklist.title, checklist.priority);
  };

  const handleMoveDraftDown = (checklist, idx) => {
    if (idx === checklist.tasks.length - 1) return;
    const newTasks = [...checklist.tasks];
    const temp = newTasks[idx];
    newTasks[idx] = newTasks[idx + 1];
    newTasks[idx + 1] = temp;
    handleTaskChange(checklist._id, newTasks, checklist.title, checklist.priority);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* AI Chat Column */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "background.paper",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "secondary.main",
                    background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                  }}
                >
                  <AutoAwesomeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    AI Checklist Architect
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Chat to generate, structure, and refine your task lists
                  </Typography>
                </Box>
              </Box>

              {/* Chat Message Stream - with dedicated internal scroll */}
              <Box
                ref={chatScrollContainerRef}
                sx={{
                  flexGrow: 1,
                  p: 3,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  bgcolor: "#fcfcfd",
                }}
              >
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        gap: 1.5,
                      }}
                    >
                      {!isUser && (
                        <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
                          <SmartToyIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      )}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          maxWidth: "85%",
                          borderRadius: 3,
                          bgcolor: isUser ? "primary.main" : "background.paper",
                          color: isUser ? "#fff" : "text.primary",
                          border: isUser ? "none" : "1px solid",
                          borderColor: "divider",
                          borderTopRightRadius: isUser ? 2 : 16,
                          borderTopLeftRadius: !isUser ? 2 : 16,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } },
                          "& ul, & ol": { pl: 2.5, my: 0.5 },
                          "& li": { mb: 0.25 },
                          "& strong": { fontWeight: 700 },
                        }}
                      >
                        {isUser ? (
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                            {msg.content}
                          </Typography>
                        ) : (
                          <Box sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </Box>
                        )}
                      </Paper>
                      {isUser && (
                        <Avatar sx={{ bgcolor: "secondary.main", width: 34, height: 34 }}>
                          <PersonIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      )}
                    </Box>
                  );
                })}

                {isLoading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
                      <SmartToyIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Drafting checklist structure...
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>

              {/* Chat Input Form */}
              <Box
                component="form"
                onSubmit={handleGenerate}
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  gap: 1.5,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Ask to create a checklist (e.g. 'Plan my product launch')..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  disabled={isLoading}
                  size="small"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || !request.trim()}
                  sx={{ px: 3, borderRadius: 2.5 }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Draft Checklists Column */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              {/* Draft Header */}
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "background.paper",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Pending Drafts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Review and approve before moving to your active workspace
                  </Typography>
                </Box>
                <Chip
                  label={`${draftChecklists.length} Draft${draftChecklists.length === 1 ? "" : "s"}`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              {/* Draft List Scroll Area */}
              <Box
                ref={draftsScrollContainerRef}
                sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#fcfcfd" }}
              >
                {draftChecklists.length === 0 ? (
                  <Box
                    sx={{
                      p: 6,
                      textAlign: "center",
                      border: "2px dashed",
                      borderColor: "divider",
                      borderRadius: 4,
                      bgcolor: "background.paper",
                      my: 4,
                    }}
                  >
                    <ListAltIcon sx={{ fontSize: 56, color: "text.secondary", opacity: 0.4, mb: 1 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      No pending drafts
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto" }}>
                      Ask the AI assistant on the left to create a checklist for you, and it will appear here for review.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={3}>
                    {draftChecklists.map((checklist) => (
                      <DraftChecklistCard
                        key={checklist._id}
                        checklist={checklist}
                        onApprove={() => handleApprove(checklist._id)}
                        onDecline={() => handleDecline(checklist._id)}
                        onChecklistPriorityChange={(newPriority) =>
                          handleChecklistPriorityChange(checklist, newPriority)
                        }
                        onEditTask={(idx, title, priority) =>
                          handleEditTask(checklist, idx, title, priority)
                        }
                        onDeleteTask={(idx) => handleDeleteTask(checklist, idx)}
                        onAddTask={(title, priority) =>
                          handleAddTask(checklist, title, priority)
                        }
                        onMoveUp={(idx) => handleMoveDraftUp(checklist, idx)}
                        onMoveDown={(idx) => handleMoveDraftDown(checklist, idx)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function DraftChecklistCard({
  checklist,
  onApprove,
  onDecline,
  onChecklistPriorityChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onMoveUp,
  onMoveDown,
}) {
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  const submitNewTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAddTask(newTask.trim(), newTaskPriority);
    setNewTask("");
    setNewTaskPriority("medium");
  };

  const submitEdit = (idx) => {
    if (!editValue.trim()) return;
    onEditTask(idx, editValue.trim(), editPriority);
    setEditingIdx(null);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with Title and Editable Checklist Priority Selector */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {checklist.title}
            </Typography>
            <Chip
              size="small"
              label={`${checklist.tasks?.length || 0} tasks`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Checklist Priority Dropdown */}
          <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
            <Select
              value={checklist.priority || "medium"}
              onChange={(e) => onChecklistPriorityChange(e.target.value)}
              renderValue={(val) => {
                const badge = getPriorityBadgeProps(val);
                return (
                  <Chip
                    label={badge.label}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      color: badge.color,
                      bgcolor: badge.bgcolor,
                      border: `1px solid ${badge.border}`,
                    }}
                  />
                );
              }}
            >
              <MenuItem value="high">High Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="low">Low Priority</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Tasks */}
        <Stack spacing={1} sx={{ mb: 2.5 }}>
          {checklist.tasks.map((task, idx) => {
            const taskPriority = getPriorityBadgeProps(task.priority);

            return (
              <Paper
                key={task._id || idx}
                elevation={0}
                sx={{
                  p: 1.25,
                  px: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: { xs: "wrap", sm: "nowrap" },
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
                    />
                    <FormControl size="small" sx={{ minWidth: 95, flexShrink: 0 }}>
                      <Select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </Select>
                    </FormControl>
                    <Button size="small" variant="contained" onClick={() => submitEdit(idx)}>
                      Save
                    </Button>
                    <Button size="small" onClick={() => setEditingIdx(null)}>
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, overflow: "hidden" }}>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ pr: 1 }}>
                        {idx + 1}. {task.title}
                      </Typography>
                    </Box>

                    {/* Task Priority Selector Dropdown */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                      <FormControl size="small" sx={{ minWidth: 95 }}>
                        <Select
                          value={task.priority || "medium"}
                          onChange={(e) => onEditTask(idx, task.title, e.target.value)}
                          sx={{
                            height: 26,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: taskPriority.bgcolor,
                            color: taskPriority.color,
                            border: `1px solid ${taskPriority.border}`,
                            "& .MuiSelect-select": {
                              py: 0.2,
                              px: 0.8,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                          }}
                        >
                          <MenuItem value="high" sx={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>
                            High
                          </MenuItem>
                          <MenuItem value="medium" sx={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>
                            Medium
                          </MenuItem>
                          <MenuItem value="low" sx={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700 }}>
                            Low
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <Tooltip title="Edit task title">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditValue(task.title);
                            setEditPriority(task.priority || "medium");
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Move up">
                        <span>
                          <IconButton
                            size="small"
                            disabled={idx === 0}
                            onClick={() => onMoveUp(idx)}
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton
                            size="small"
                            disabled={idx === checklist.tasks.length - 1}
                            onClick={() => onMoveDown(idx)}
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete task">
                        <IconButton size="small" color="error" onClick={() => onDeleteTask(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Paper>
            );
          })}
        </Stack>

        {/* Add custom item form with priority */}
        <Box component="form" onSubmit={submitNewTask} sx={{ display: "flex", gap: 1, mb: 3 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Add custom task to draft..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 100, flexShrink: 0 }}>
            <Select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="outlined" startIcon={<AddIcon />} disabled={!newTask.trim()}>
            Add
          </Button>
        </Box>

        {/* Card Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={onDecline}>
            Decline
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={onApprove}
            sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
          >
            Approve & Add to Dashboard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default Agent;
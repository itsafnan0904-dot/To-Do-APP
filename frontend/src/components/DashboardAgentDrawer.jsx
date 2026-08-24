import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Chip,
  Paper,
  Stack,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

function DashboardAgentDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi there! I'm your Dashboard Task Analyst. Ask me anything about your checklists, pending tasks, progress, or what to focus on next!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "What tasks are unfinished?",
    "Checklist breakdown & metrics",
    "What should I prioritize?",
    "Show completed tasks",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === "string" ? textToSend : inputMessage).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    if (typeof textToSend !== "string") {
      setInputMessage("");
    }
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post("/agent/dashboard-assistant", {
        messages: apiMessages,
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: res.data.message },
      ]);
    } catch (err) {
      console.error("Error talking to dashboard assistant:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "⚠️ Sorry, I ran into an issue analyzing your checklists. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440 },
          p: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Task Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI Task Filter & Analytics
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Quick Suggestion Chips */}
      <Box sx={{ p: 2, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
          QUICK ACTIONS
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {quickPrompts.map((prompt, idx) => (
            <Chip
              key={idx}
              label={prompt}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              clickable
              size="small"
              sx={{
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Messages Scroll Area */}
      <Box
        sx={{
          flexGrow: 1,
          p: 2.5,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                gap: 1.5,
              }}
            >
              {!isUser && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "primary.main",
                    fontSize: "0.85rem",
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: "80%",
                  borderRadius: 3,
                  bgcolor: isUser ? "primary.main" : "background.default",
                  color: isUser ? "#fff" : "text.primary",
                  border: isUser ? "none" : "1px solid",
                  borderColor: "divider",
                  borderTopRightRadius: isUser ? 2 : 16,
                  borderTopLeftRadius: !isUser ? 2 : 16,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {msg.content}
                </Typography>
              </Paper>
              {isUser && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "secondary.main",
                    fontSize: "0.85rem",
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
            </Box>
          );
        })}

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              <SmartToyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Analyzing your checklist data...
              </Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Footer */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask about tasks or checklists..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !inputMessage.trim()}
          sx={{ minWidth: 48, px: 2, borderRadius: 3 }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Drawer>
  );
}

export default DashboardAgentDrawer;

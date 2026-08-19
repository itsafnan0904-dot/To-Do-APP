import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

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
      const token = localStorage.getItem("token");
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axios.post(
        "http://localhost:5000/api/agent/dashboard-assistant",
        { messages: apiMessages },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    <>
      {/* Drawer Overlay (clicks outside to close) */}
      {isOpen && (
        <div className="dashboard-drawer-overlay" onClick={onClose} />
      )}

      {/* Slide-out Drawer Panel */}
      <div className={`dashboard-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="dashboard-drawer-header">
          <div className="dashboard-drawer-title">
            <span className="drawer-sparkle-icon">✨</span>
            <div>
              <h3>Task Assistant</h3>
              <p>AI Task Filter & Analytics</p>
            </div>
          </div>
          <button
            className="dashboard-drawer-close"
            onClick={onClose}
            aria-label="Close Assistant"
          >
            ✕
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="dashboard-drawer-chips">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              className="drawer-chip-btn"
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="dashboard-drawer-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`drawer-chat-bubble-wrapper ${
                msg.role === "user" ? "user-wrapper" : "assistant-wrapper"
              }`}
            >
              <div
                className={`drawer-chat-bubble ${
                  msg.role === "user" ? "user" : "assistant"
                }`}
              >
                <div className="drawer-bubble-text">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="drawer-chat-bubble-wrapper assistant-wrapper">
              <div className="drawer-chat-bubble assistant loading">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="dashboard-drawer-input-form"
        >
          <input
            type="text"
            placeholder="Ask about tasks, priorities, progress..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !inputMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}

export default DashboardAgentDrawer;

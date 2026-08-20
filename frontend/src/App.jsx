import { ThemeProvider, CssBaseline } from "@mui/material";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { theme } from "./theme";

import Login from "./pages/login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Agent from "./pages/Agent";
import ChecklistDetail from "./pages/ChecklistDetail";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Public Only Route Component (redirects logged in users to dashboard)
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Check initial authentication token without doing raw window.location.href loops
    setTokenChecked(true);
  }, []);

  if (!tokenChecked) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route path="/welcome" element={<Welcome />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute>
                <Agent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist/:id"
            element={
              <ProtectedRoute>
                <ChecklistDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
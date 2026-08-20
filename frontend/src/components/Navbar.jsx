import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  AutoAwesome as AutoAwesomeIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Removed "Welcome" link from navbar as requested
  const navItems = isLoggedIn
    ? [
        { label: "My Tasks", path: "/dashboard", icon: <DashboardIcon /> },
        { label: "AI Agent", path: "/agent", icon: <AutoAwesomeIcon /> },
      ]
    : [
        { label: "Sign In", path: "/", icon: <LoginIcon /> },
        { label: "Sign Up", path: "/signup", icon: <PersonAddIcon /> },
      ];

  const drawerContent = (
    <Box sx={{ width: 250, p: 2 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, px: 1 }}>
        <CheckCircleIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Typography variant="h6" fontWeight="bold">
          TaskFlow
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? "primary.light" : "transparent",
                  color: isActive ? "white" : "inherit",
                  "&:hover": {
                    bgcolor: isActive ? "primary.main" : "action.hover",
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "white" : "primary.main", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
        {isLoggedIn && (
          <ListItem disablePadding sx={{ mt: 2 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: "error.main",
                "&:hover": { bgcolor: "error.light", color: "white" },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
            {/* Logo */}
            <Box
              onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
                }}
              >
                <CheckCircleIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.1,
                  }}
                >
                  TaskFlow
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Productivity & Checklist Manager
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {isLoggedIn ? (
                  <>
                    <Button
                      startIcon={<DashboardIcon />}
                      variant={location.pathname === "/dashboard" ? "contained" : "text"}
                      color={location.pathname === "/dashboard" ? "primary" : "inherit"}
                      onClick={() => navigate("/dashboard")}
                      sx={{
                        fontWeight: 600,
                        color: location.pathname === "/dashboard" ? "#fff" : "text.primary",
                      }}
                    >
                      My Tasks
                    </Button>

                    <Button
                      startIcon={<AutoAwesomeIcon />}
                      variant={location.pathname === "/agent" ? "contained" : "outlined"}
                      color="secondary"
                      onClick={() => navigate("/agent")}
                      sx={{
                        fontWeight: 600,
                        borderRadius: "10px",
                        boxShadow:
                          location.pathname === "/agent"
                            ? "0 4px 14px rgba(236, 72, 153, 0.35)"
                            : "none",
                      }}
                    >
                      AI Agent
                    </Button>

                    <Tooltip title="Log Out">
                      <Button
                        variant="text"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{ ml: 1 }}
                      >
                        Logout
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Button
                      variant={location.pathname === "/" ? "contained" : "outlined"}
                      color="primary"
                      startIcon={<LoginIcon />}
                      onClick={() => navigate("/")}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={location.pathname === "/signup" ? "contained" : "outlined"}
                      color="secondary"
                      startIcon={<PersonAddIcon />}
                      onClick={() => navigate("/signup")}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              /* Mobile Menu Button */
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Navbar;
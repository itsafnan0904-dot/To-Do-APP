import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6366f1", // Modern Indigo
      light: "#818cf8",
      dark: "#4f46e5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ec4899", // Pink accent
      light: "#f472b6",
      dark: "#db2777",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "1.05rem",
      color: "#64748b",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          padding: "8px 20px",
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.35)",
            transform: "translateY(-1px)",
          },
        },
        containedSecondary: {
          "&:hover": {
            boxShadow: "0 4px 14px 0 rgba(236, 72, 153, 0.35)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.05)",
          border: "1px solid #f1f5f9",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
          },
        },
      },
    },
  },
});

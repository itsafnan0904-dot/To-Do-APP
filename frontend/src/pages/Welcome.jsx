import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp,
  Bolt,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Welcome() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 8, textAlign: "center" }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: 8,
            bgcolor: "rgba(99, 102, 241, 0.08)",
            color: "primary.main",
            fontWeight: 700,
            fontSize: "0.875rem",
            mb: 3,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 18 }} /> Next-Gen AI Task & Checklist Assistant
        </Box>

        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontSize: { xs: "2.5rem", md: "3.75rem" },
            fontWeight: 800,
            lineHeight: 1.15,
            mb: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Organize Smarter. Build Checklists with{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI Intelligence
          </Box>
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto", mb: 5, fontWeight: 400, lineHeight: 1.6 }}
        >
          Transform complex projects, daily routines, or study roadmaps into actionable checklists
          instantly with AI-powered draft generation, review steps, and interactive tracking.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          sx={{ mb: 10 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(token ? "/dashboard" : "/signup")}
            endIcon={<ArrowForward />}
            sx={{
              px: 4,
              py: 1.75,
              fontSize: "1.05rem",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            }}
          >
            {token ? "Go to Dashboard" : "Get Started Free"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(token ? "/agent" : "/")}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              px: 4,
              py: 1.75,
              fontSize: "1.05rem",
            }}
          >
            Explore AI Agent
          </Button>
        </Stack>

        {/* Feature Cards Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                p: 3,
                textAlign: "left",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: "rgba(99, 102, 241, 0.1)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Bolt fontSize="medium" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Instant AI Checklists
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prompt in plain English and receive fully structured draft checklists with customizable tasks in seconds.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                p: 3,
                textAlign: "left",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: "rgba(236, 72, 153, 0.1)",
                    color: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <TrendingUp fontSize="medium" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Interactive Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track completion progress in real-time and consult your dashboard AI assistant for productivity metrics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                p: 3,
                textAlign: "left",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: "rgba(16, 185, 129, 0.1)",
                    color: "success.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <CheckCircleOutline fontSize="medium" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Seamless Collaboration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drag, reorder, mark completed, and refine tasks effortlessly with intuitive Material Design controls.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Welcome;
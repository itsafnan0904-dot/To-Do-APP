import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import todoRoutes from "./routes/todoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Todo routes
app.use("/api/todos", todoRoutes);

// AI Agent routes
app.use("/api/agent", agentRoutes);

// Checklist routes
app.use("/api/checklists", checklistRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Todo App Backend is running!");
});

// MongoDB connection cache for serverless environments
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI environment variable is not defined");
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
};

// Middleware to ensure DB connection per request in serverless
app.use(async (req, res, next) => {
    if (!isConnected) {
        await connectDB();
    }
    next();
});

// Start local dev server if not in Vercel serverless environment
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    });
}

export default app;
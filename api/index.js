import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "../backend/routes/authRoutes.js";
import todoRoutes from "../backend/routes/todoRoutes.js";
import agentRoutes from "../backend/routes/agentRoutes.js";
import checklistRoutes from "../backend/routes/checklistRoutes.js";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("/*splat", cors(corsOptions));

app.use(express.json());

// MongoDB connection cache for serverless environments
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState >= 1) return;
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
  await connectDB();
  next();
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Todo routes
app.use("/api/todos", todoRoutes);

// AI Agent routes
app.use("/api/agent", agentRoutes);

// Checklist routes
app.use("/api/checklists", checklistRoutes);

// Health check / root API route
app.get("/api", (req, res) => {
  res.status(200).json({ message: "Todo App API is running on Vercel!" });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Todo App Backend is running!" });
});

export default app;

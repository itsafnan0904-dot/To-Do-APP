import express from "express";
import Checklist from "../models/Checklist.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all draft checklists for the user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter = { user: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const checklists = await Checklist.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ checklists });
  } catch (error) {
    console.error("Get Checklists error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific checklist by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    res.status(200).json({ checklist });
  } catch (error) {
    console.error("Get Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a checklist's tasks
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { tasks, title } = req.body;

    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    if (tasks !== undefined) checklist.tasks = tasks;
    if (title !== undefined) checklist.title = title;

    await checklist.save();

    res.status(200).json({ message: "Checklist updated", checklist });
  } catch (error) {
    console.error("Update Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a specific task's completion status
router.put("/:id/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { completed } = req.body;
    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const task = checklist.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.completed = completed;
    await checklist.save();

    res.status(200).json({ message: "Task updated", checklist });
  } catch (error) {
    console.error("Update Task error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Decline/Delete a checklist
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    await Checklist.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: "Checklist deleted" });
  } catch (error) {
    console.error("Delete Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve a checklist
router.post("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    checklist.status = "approved";
    await checklist.save();

    res.status(200).json({
      message: "Checklist approved",
      checklist,
    });
  } catch (error) {
    console.error("Approve Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import express from "express";
import Checklist from "../models/Checklist.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const normalizePriority = (val) => {
  const p = (val || "").toString().toLowerCase().trim();
  if (["low", "medium", "high"].includes(p)) return p;
  return "medium";
};

// Get all checklists for the user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter = { user: req.user.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const checklists = await Checklist.find(filter).sort({ createdAt: -1 });

    // Ensure fallback to medium for old records without priority
    const sanitizedChecklists = checklists.map((cl) => {
      const doc = cl.toObject();
      doc.priority = normalizePriority(doc.priority);
      doc.tasks = (doc.tasks || []).map((t) => ({
        ...t,
        priority: normalizePriority(t.priority),
      }));
      return doc;
    });

    res.status(200).json({ checklists: sanitizedChecklists });
  } catch (error) {
    console.error("Get Checklists error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new checklist
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, tasks, status, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const formattedTasks = Array.isArray(tasks)
      ? tasks.map((t) => ({
          title: typeof t === "string" ? t : t.title || "Task",
          completed: typeof t === "object" ? !!t.completed : false,
          priority: typeof t === "object" ? normalizePriority(t.priority) : "medium",
        }))
      : [];

    const checklist = await Checklist.create({
      title: title.trim(),
      priority: normalizePriority(priority),
      tasks: formattedTasks,
      status: status || "approved",
      user: req.user.userId,
    });

    res.status(201).json({
      message: "Checklist created successfully",
      checklist,
    });
  } catch (error) {
    console.error("Create Checklist error:", error);
    res.status(500).json({ message: "Server error creating checklist" });
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

    const doc = checklist.toObject();
    doc.priority = normalizePriority(doc.priority);
    doc.tasks = (doc.tasks || []).map((t) => ({
      ...t,
      priority: normalizePriority(t.priority),
    }));

    res.status(200).json({ checklist: doc });
  } catch (error) {
    console.error("Get Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a checklist's tasks, title, or priority
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { tasks, title, priority } = req.body;

    const checklist = await Checklist.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    if (tasks !== undefined && Array.isArray(tasks)) {
      checklist.tasks = tasks.map((t) => ({
        _id: t._id,
        title: t.title,
        completed: !!t.completed,
        priority: normalizePriority(t.priority),
      }));
    }
    if (title !== undefined) checklist.title = title;
    if (priority !== undefined) checklist.priority = normalizePriority(priority);

    await checklist.save();

    res.status(200).json({ message: "Checklist updated", checklist });
  } catch (error) {
    console.error("Update Checklist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a specific task's completion or priority status
router.put("/:id/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { completed, priority, title } = req.body;
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

    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = normalizePriority(priority);
    if (title !== undefined) task.title = title;

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

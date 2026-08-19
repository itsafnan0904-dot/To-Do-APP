import express from "express";
import Checklist from "../models/Checklist.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all checklists for the user (can filter by ?status=draft or ?status=approved)
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

// Create a new checklist
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, tasks, status } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Checklist title is required" });
        }

        const formattedTasks = (tasks || []).map(t => {
            if (typeof t === "string") return { title: t, completed: false };
            return { title: t.title, completed: t.completed || false };
        });

        const checklist = await Checklist.create({
            title: title.trim(),
            tasks: formattedTasks,
            status: status || "approved",
            user: req.user.userId,
        });

        res.status(201).json({ message: "Checklist created successfully", checklist });
    } catch (error) {
        console.error("Create Checklist error:", error);
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

// Update a checklist's tasks or title
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

        if (title !== undefined) checklist.title = title.trim();

        if (tasks !== undefined) {
            checklist.tasks = tasks.map(t => {
                if (typeof t === "string") return { title: t, completed: false };
                const taskObj = { title: t.title, completed: Boolean(t.completed) };
                if (t._id) taskObj._id = t._id;
                return taskObj;
            });
        }

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

// Delete a checklist
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

// Approve a checklist (changes status to approved)
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

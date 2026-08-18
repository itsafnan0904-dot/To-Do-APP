import express from "express";
import Checklist from "../models/Checklist.js";
import Todo from "../models/Todo.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all draft checklists for the user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const checklists = await Checklist.find({
            user: req.user.userId,
            status: "draft",
        }).sort({ createdAt: -1 });

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

        if (checklist.tasks.length === 0) {
            return res.status(400).json({ message: "Checklist has no tasks" });
        }

        const todoCount = await Todo.countDocuments({
            user: req.user.userId,
        });

        const createdTodos = [];
        for (let i = 0; i < checklist.tasks.length; i++) {
            const todo = await Todo.create({
                title: checklist.tasks[i],
                completed: false,
                position: todoCount + i,
                user: req.user.userId,
            });
            createdTodos.push(todo);
        }

        // Delete the draft checklist
        await Checklist.deleteOne({ _id: checklist._id });

        res.status(201).json({
            message: "Checklist approved and tasks moved to Todo list",
            tasks: createdTodos,
        });
    } catch (error) {
        console.error("Approve Checklist error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;

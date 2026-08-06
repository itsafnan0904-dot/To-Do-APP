import express from "express";
import Todo from "../models/Todo.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();



router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Todo title is required",
            });
        }

        const todoCount = await Todo.countDocuments({
            user: req.user.userId,
        });

        const todo = await Todo.create({
            title,
            completed: false,
            position: todoCount,
            user: req.user.userId,
        });

        res.status(201).json({
            message: "Todo created successfully",
            todo,
        });

    } catch (error) {
        console.error("Create Todo error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});



router.get("/", authMiddleware, async (req, res) => {
    try {
        const todos = await Todo.find({
            user: req.user.userId,
        }).sort({ position: 1 });

        res.status(200).json({
            message: "Todos fetched successfully",
            todos,
        });

    } catch (error) {
        console.error("Get Todos error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});




router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { title, completed } = req.body;

        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!todo) {
            return res.status(404).json({
                message: "Todo not found",
            });
        }

        if (title !== undefined) {
            todo.title = title;
        }

        if (completed !== undefined) {
            todo.completed = completed;
        }

        await todo.save();

        res.status(200).json({
            message: "Todo updated successfully",
            todo,
        });

    } catch (error) {
        console.error("Update Todo error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});




router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!todo) {
            return res.status(404).json({
                message: "Todo not found",
            });
        }

        await Todo.deleteOne({
            _id: req.params.id,
        });

        res.status(200).json({
            message: "Todo deleted successfully",
        });

    } catch (error) {
        console.error("Delete Todo error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});



router.put("/:id/up", authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!todo) {
            return res.status(404).json({
                message: "Todo not found",
            });
        }

        const previousTodo = await Todo.findOne({
            user: req.user.userId,
            position: todo.position - 1,
        });

        if (!previousTodo) {
            return res.status(400).json({
                message: "Todo is already at the top",
            });
        }

        const currentPosition = todo.position;

        todo.position = previousTodo.position;
        previousTodo.position = currentPosition;

        await todo.save();
        await previousTodo.save();

        res.status(200).json({
            message: "Todo moved up successfully",
        });

    } catch (error) {
        console.error("Move Up error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});


router.put("/:id/down", authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!todo) {
            return res.status(404).json({
                message: "Todo not found",
            });
        }

        const nextTodo = await Todo.findOne({
            user: req.user.userId,
            position: todo.position + 1,
        });

        if (!nextTodo) {
            return res.status(400).json({
                message: "Todo is already at the bottom",
            });
        }

        const currentPosition = todo.position;

        todo.position = nextTodo.position;
        nextTodo.position = currentPosition;

        await todo.save();
        await nextTodo.save();

        res.status(200).json({
            message: "Todo moved down successfully",
        });

    } catch (error) {
        console.error("Move Down error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
});


export default router;
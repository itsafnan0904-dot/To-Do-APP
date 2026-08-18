import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

import authMiddleware from "../middleware/authMiddleware.js";
import Todo from "../models/Todo.js";

dotenv.config();

const router = express.Router();

// OpenRouter client
const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});


// ============================================================
// GENERATE AI CHECKLIST
// ============================================================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { request } = req.body;

        console.log("Agent request:", request);

        const response = await client.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b",

            messages: [
                {
                    role: "system",
                    content: `
You are an AI checklist assistant.

The user will describe something they want to accomplish.

Convert their request into a clear checklist of actionable tasks.

Return ONLY valid JSON in this exact format:

{
    "tasks": [
        "Task 1",
        "Task 2",
        "Task 3"
    ]
}

Rules:
- Return only JSON.
- Do not use markdown.
- Do not add explanations.
- Each task must be a clear, actionable Todo item.
                    `,
                },

                {
                    role: "user",
                    content: request,
                },
            ],
        });

        const answer = response.choices[0].message.content;

        console.log("Nemotron response:", answer);

        const checklist = JSON.parse(answer);

        console.log("Parsed checklist:", checklist);

        // IMPORTANT:
        // Do NOT save to MongoDB yet.
        // Wait for the user to approve the checklist.

        res.status(200).json({
            tasks: checklist.tasks,
        });

    } catch (error) {
        console.error("Agent error:", error);

        res.status(500).json({
            message: "Failed to generate checklist",
        });
    }
});


// ============================================================
// APPROVE CHECKLIST AND SAVE TO TODOS
// ============================================================

router.post("/approve", authMiddleware, async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({
                message: "No tasks provided",
            });
        }

        // Get current Todo count
        const todoCount = await Todo.countDocuments({
            user: req.user.userId,
        });

        const createdTodos = [];

        // Save approved tasks to MongoDB
        for (let i = 0; i < tasks.length; i++) {
            const todo = await Todo.create({
                title: tasks[i],
                completed: false,
                position: todoCount + i,
                user: req.user.userId,
            });

            createdTodos.push(todo);
        }

        console.log("Approved AI Todos:", createdTodos);

        res.status(201).json({
            message: "Checklist approved and tasks moved to Todo list",
            tasks: createdTodos,
        });

    } catch (error) {
        console.error("Approve checklist error:", error);

        res.status(500).json({
            message: "Failed to approve checklist",
        });
    }
});


export default router;
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

import authMiddleware from "../middleware/authMiddleware.js";


dotenv.config();

const router = express.Router();

// OpenRouter client
const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});


import Checklist from "../models/Checklist.js";

// ============================================================
// CONVERSATIONAL AI CHECKLIST GENERATOR
// ============================================================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: "Messages array is required" });
        }

        const systemMessage = {
            role: "system",
            content: `
You are an AI checklist assistant. You help the user figure out what tasks they need to do.
Converse naturally with the user to understand their needs. Ask clarifying questions if necessary.
When you have enough information and are ready to generate the final checklist, output a JSON block wrapped in \`\`\`json ... \`\`\`.

The JSON must be in this exact format:
{
    "title": "A short title for this checklist",
    "tasks": [
        "Task 1",
        "Task 2",
        "Task 3"
    ]
}

Only output the JSON block when you are actually generating the checklist. Otherwise, converse normally.
            `,
        };

        const apiMessages = [systemMessage, ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))];

        const response = await client.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b",
            messages: apiMessages,
        });

        const answer = response.choices[0].message.content;

        // Check if there is a JSON block
        const jsonMatch = answer.match(/```json([\s\S]*?)```/);

        let checklistData = null;
        let draftChecklist = null;

        if (jsonMatch) {
            try {
                checklistData = JSON.parse(jsonMatch[1]);

                // Create draft checklist
                draftChecklist = await Checklist.create({
                    title: checklistData.title || "Generated Checklist",
                    tasks: (checklistData.tasks || []).map(taskTitle => ({ title: taskTitle, completed: false })),
                    user: req.user.userId,
                    status: "draft"
                });

            } catch (err) {
                console.error("Error parsing AI JSON output", err);
            }
        }

        res.status(200).json({
            message: answer,
            checklist: draftChecklist
        });

    } catch (error) {
        console.error("Agent error:", error);
        res.status(500).json({
            message: "Failed to communicate with agent",
        });
    }
});

// ============================================================
// DASHBOARD FILTERING & ANALYTICS ASSISTANT
// ============================================================
router.post("/dashboard-assistant", authMiddleware, async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: "Messages array is required" });
        }

        // Fetch all checklists for the authenticated user
        const userChecklists = await Checklist.find({ user: req.user.userId }).sort({ createdAt: -1 });

        // Build data summary for context injection
        const formattedChecklists = userChecklists.map((cl, idx) => {
            const total = cl.tasks?.length || 0;
            const completed = cl.tasks?.filter(t => t.completed).length || 0;
            const pending = total - completed;
            const taskList = (cl.tasks || []).map(t => `- [${t.completed ? "x" : " "}] ${t.title}`).join("\n  ");
            return `Checklist #${idx + 1}: "${cl.title}" (Status: ${cl.status})
- Progress: ${completed}/${total} completed (${pending} pending)
- Tasks:
  ${taskList || "(No tasks)"}`;
        }).join("\n\n");

        const systemMessage = {
            role: "system",
            content: `You are the Dashboard AI Assistant & Task Analyst for the user's checklist management system.
You have real-time access to all checklists and tasks belonging to the user.

CURRENT USER CHECKLIST DATA:
${formattedChecklists ? formattedChecklists : "The user currently has no checklists or tasks."}

YOUR CAPABILITIES & GUIDELINES:
1. Task Filtering Queries: Answer questions about specific tasks, unfinished/pending items, or completed items across one or multiple checklists (e.g., "What tasks are left in Python?", "Show all completed tasks").
2. Task Summaries & Metrics: Provide overall progress, completion percentages, total tasks, and category/checklist breakdowns.
3. Analytical & Prioritization Queries:
   - Identify which checklist has the most pending/unfinished tasks.
   - Identify which checklist is closest to completion.
   - Suggest what to prioritize or tackle first based on pending items and completion progress.
4. Strict Guardrails:
   - Strictly base all factual answers regarding checklists and tasks only on the provided user data.
   - Keep answers clear, supportive, concise, and nicely formatted with bullet points or bold text where appropriate.
   - Do not make up non-existent tasks or checklists.
`
        };

        const apiMessages = [
            systemMessage,
            ...messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];

        const response = await client.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b",
            messages: apiMessages,
        });

        const answer = response.choices[0].message.content;

        res.status(200).json({
            message: answer,
        });

    } catch (error) {
        console.error("Dashboard assistant error:", error);
        res.status(500).json({
            message: "Failed to communicate with dashboard assistant",
        });
    }
});

export default router;
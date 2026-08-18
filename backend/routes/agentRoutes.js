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
                    tasks: checklistData.tasks || [],
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


export default router;
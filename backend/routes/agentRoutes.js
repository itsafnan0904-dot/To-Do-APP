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


// ============================================================
// AI AGENT ROUTE
// ============================================================

router.post("/", authMiddleware, async (req, res) => {
    try {

        // Get the user's request
        const { request } = req.body;

        console.log("Agent request:", request);

        // Send request to Nemotron through OpenRouter
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


        // Get AI response
        const answer = response.choices[0].message.content;

        console.log("Nemotron response:", answer);


        // Convert JSON text into a JavaScript object
        const checklist = JSON.parse(answer);

        console.log("Parsed checklist:", checklist);


        // Send checklist back to frontend
        res.json({
            tasks: checklist.tasks,
        });


    } catch (error) {

        console.error("Agent error:", error);

        res.status(500).json({
            message: "Failed to generate checklist",
        });
    }
});


export default router;
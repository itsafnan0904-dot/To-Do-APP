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

const normalizePriority = (val) => {
  const p = (val || "").toString().toLowerCase().trim();
  if (["low", "medium", "high"].includes(p)) return p;
  return "medium";
};

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
      content: `You are an expert AI Checklist Architect. You help users structure and plan projects, routines, and workflows into clear checklists.
Converse naturally and concisely with the user to understand what they need. Ask clarifying questions if necessary.

When you are ready to generate a checklist, provide ONLY a short, friendly, and helpful message (e.g., "I've created your checklist with customized priorities and placed it in the **Pending Drafts** panel. You can review the tasks and adjust priorities before approving it.") AND append the JSON code block in this exact format:

\`\`\`json
{
  "title": "A short, descriptive title",
  "priority": "high",
  "tasks": [
    {
      "title": "First actionable step",
      "priority": "high"
    },
    {
      "title": "Second actionable step",
      "priority": "medium"
    },
    {
      "title": "Third actionable step",
      "priority": "low"
    }
  ]
}
\`\`\`

CRITICAL RULES:
1. Do NOT repeat or list the generated tasks or task descriptions in your conversational text. All tasks must reside strictly inside the JSON block so they only show up in the Pending Drafts card.
2. Priority values for the checklist and every task MUST be strictly one of: "low", "medium", or "high".
3. Keep your conversational responses concise, formatted in clean markdown.`,
    };

    const apiMessages = [
      systemMessage,
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model: "nvidia/nemotron-3-nano-30b-a3b",
      messages: apiMessages,
    });

    const rawAnswer = response.choices[0].message.content;

    // Check if there is a JSON block
    let jsonMatch = rawAnswer.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = rawAnswer.match(/```\s*(\{[\s\S]*?\})\s*```/);
    }

    let checklistData = null;
    let draftChecklist = null;
    let cleanMessage = rawAnswer;

    if (jsonMatch) {
      // Strip out the JSON code block from the message displayed in chat
      cleanMessage = rawAnswer.replace(/```json[\s\S]*?```/gi, "").replace(/```[\s\S]*?```/gi, "").trim();
      if (!cleanMessage) {
        cleanMessage = "Your checklist is ready in the **Pending Drafts** panel. You can review the tasks, adjust priorities, and edit details before approving.";
      }

      try {
        checklistData = JSON.parse(jsonMatch[1]);

        if (checklistData && (checklistData.tasks || checklistData.title)) {
          // Normalize tasks
          const rawTasks = Array.isArray(checklistData.tasks) ? checklistData.tasks : [];
          const tasks = rawTasks.map((item) => {
            if (typeof item === "string") {
              return {
                title: item,
                completed: false,
                priority: "medium",
              };
            }
            return {
              title: item.title || "Task",
              completed: false,
              priority: normalizePriority(item.priority),
            };
          });

          // Create draft checklist in database
          draftChecklist = await Checklist.create({
            title: checklistData.title || "Generated Checklist",
            priority: normalizePriority(checklistData.priority),
            tasks,
            user: req.user.userId,
            status: "draft",
          });
        }
      } catch (err) {
        console.error("Error parsing AI JSON output:", err, jsonMatch[1]);
      }
    }

    res.status(200).json({
      message: cleanMessage,
      checklist: draftChecklist,
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
    const userChecklists = await Checklist.find({ user: req.user.userId }).sort(
      { createdAt: -1 },
    );

    // Build data summary for context injection
    const formattedChecklists = userChecklists
      .map((cl, idx) => {
        const total = cl.tasks?.length || 0;
        const completed = cl.tasks?.filter((t) => t.completed).length || 0;
        const pending = total - completed;
        const taskList = (cl.tasks || [])
          .map((t) => `- [${t.completed ? "x" : " "}] (${t.priority || "medium"}) ${t.title}`)
          .join("\n  ");
        return `Checklist #${idx + 1}: "${cl.title}" (Priority: ${cl.priority || "medium"}, Status: ${cl.status})
- Progress: ${completed}/${total} completed (${pending} pending)
- Tasks:
  ${taskList || "(No tasks)"}`;
      })
      .join("\n\n");

    const systemMessage = {
      role: "system",
      content: `You are the Dashboard AI Assistant & Task Analyst for the user's checklist management system.
You have real-time access to all checklists and tasks belonging to the user.

CURRENT USER CHECKLIST DATA:
${formattedChecklists ? formattedChecklists : "The user currently has no checklists or tasks."}

YOUR CAPABILITIES & GUIDELINES:
1. Task Filtering Queries: Answer questions about specific tasks, unfinished items, or completed items across checklists.
2. Task Summaries & Metrics: Provide overall progress, completion percentages, total tasks, and category breakdowns.
3. Analytical & Prioritization Queries:
   - Identify which checklist has the most pending tasks.
   - Identify which checklist is closest to completion.
   - Suggest what to prioritize based on pending items, priority levels ("high", "medium", "low"), and completion progress.`,
    };
    const apiMessages = [
      systemMessage,
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
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

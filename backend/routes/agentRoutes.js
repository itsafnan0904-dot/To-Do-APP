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
      content: `You are an expert AI Checklist Architect. You help users structure and plan projects, routines, and workflows into clear checklists.
Converse naturally and concisely with the user to understand what they need. Ask clarifying questions if necessary.

When you are ready to generate a checklist, provide a brief, friendly message formatted in clean Markdown (using bold text and clear bullet points), AND append a JSON code block in this exact format:

\`\`\`json
{
  "title": "A short, descriptive title",
  "tasks": [
    "First actionable step",
    "Second actionable step",
    "Third actionable step"
  ]
}
\`\`\`

IMPORTANT INSTRUCTIONS:
1. Whenever you generate a checklist, always mention in your response: "Your new checklist is ready in the **Pending Drafts** section on the right! You can review, edit, or approve it whenever you're ready."
2. Keep your conversational responses formatted with clean markdown, bullet points, and bold emphasis where helpful.
3. Only include the \`\`\`json ... \`\`\` block when you are outputting the final tasks.`,
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

    // Check if there is a JSON block
    // Match ```json ... ``` or ``` { ... } ``` or raw JSON
    let jsonMatch = answer.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = answer.match(/```\s*(\{[\s\S]*?\})\s*```/);
    }

    let checklistData = null;
    let draftChecklist = null;

    if (jsonMatch) {
      try {
        checklistData = JSON.parse(jsonMatch[1]);

        if (checklistData && (checklistData.tasks || checklistData.title)) {
          // Create draft checklist in database
          draftChecklist = await Checklist.create({
            title: checklistData.title || "Generated Checklist",
            tasks: (checklistData.tasks || []).map((taskTitle) => ({
              title: typeof taskTitle === "string" ? taskTitle : taskTitle.title || "Task",
              completed: false,
            })),
            user: req.user.userId,
            status: "draft",
          });
        }
      } catch (err) {
        console.error("Error parsing AI JSON output:", err, jsonMatch[1]);
      }
    }

    res.status(200).json({
      message: answer,
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
          .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
          .join("\n  ");
        return `Checklist #${idx + 1}: "${cl.title}" (Status: ${cl.status})
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
   - Suggest what to prioritize based on pending items and completion progress.
4. Strict Guardrails:
   - Strictly base all factual answers regarding checklists and tasks only on the provided user data.
   - Do not make up non-existent tasks or checklists.

STRICT BOLD & HUMAN-FRIENDLY FORMATTING DIRECTIVE:
- ALWAYS wrap **all checklist names**, **metric labels**, and **percentages** in double asterisks (**like this**).
- NEVER use the tilde symbol ("~") or math symbols ("÷"). Use "about" or "out of".
- NEVER use index numbers like "#4". Always use the full bolded checklist title.
- Do NOT add intro filler sentences like "You're looking at...". Jump directly to the bold title.

MANDATORY OUTPUT FORMAT:

**"[Checklist Name]" Checklist** (about **[X]%** Complete)

- **Total tasks:** [Number]
- **Completed tasks:** [Number]
- **Progress:** [Number] out of [Number] completed (about **[X]%**)

**Comparison:**
- The **"[Other Checklist Name]" Checklist** is about **[X]%** complete.

**Summary:**
- [1-2 bold-highlighted sentences summarizing status and next steps]`,
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

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
// CONVERSATIONAL AI AGENT: CHECKLIST GENERATOR & TASK ANALYST
// ============================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    // Fetch all checklists for the authenticated user (both approved and draft)
    const userChecklists = await Checklist.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    // Build real checklist/task context summary
    const formattedChecklists = userChecklists
      .map((cl, idx) => {
        const total = cl.tasks?.length || 0;
        const completed = cl.tasks?.filter((t) => t.completed).length || 0;
        const pending = total - completed;
        const taskList = (cl.tasks || [])
          .map(
            (t) =>
              `- [${t.completed ? "x" : " "}] (${t.priority || "medium"}) ${t.title}`
          )
          .join("\n  ");
        return `Checklist #${idx + 1}: "${cl.title}" (Priority: ${cl.priority || "medium"}, Status: ${cl.status})
- Progress: ${completed}/${total} completed (${pending} pending)
- Tasks:
  ${taskList || "(No tasks)"}`;
      })
      .join("\n\n");

    const systemMessage = {
      role: "system",
      content: `You are an expert AI productivity assistant and checklist generator.

You have TWO primary responsibilities:
1. Generate new checklists when the user asks you to create or plan tasks.
2. Analyze the user's existing checklists and tasks when the user asks about their work, completion, priorities, productivity, or unfinished tasks.

CURRENT USER CHECKLIST DATA (AUTHENTICATED USER ONLY):
${formattedChecklists ? formattedChecklists : "The user currently has no checklists or tasks."}

============================================================
1. REQUEST TYPE DISCRIMINATION
============================================================
Determine whether the user is asking for:
A. CHECKLIST GENERATION (e.g. "Create a Python learning checklist", "Make a checklist for building a MERN application")
B. EXISTING TASK / PRODUCTIVITY ANALYSIS (e.g. "What tasks are left in Python?", "Show me unfinished tasks", "Give me a productivity summary", "Group my pending tasks into 25-minute work blocks", "Which checklist has the most unfinished tasks?")

============================================================
2. CHECKLIST GENERATION GUIDELINES (TYPE A)
============================================================
When generating a checklist:
- Provide ONLY a short, friendly message informing the user that their draft is ready in the **Pending Drafts** panel.
- Append the JSON block in this exact format:

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

CRITICAL GENERATION RULES:
- Do NOT repeat or list the generated tasks in your conversational text. All new tasks must reside strictly inside the JSON block so they appear only in the Pending Drafts card.
- Priority values must be strictly "low", "medium", or "high".

============================================================
3. EXISTING TASK / PRODUCTIVITY ANALYSIS GUIDELINES (TYPE B)
============================================================
- Do NOT output a JSON block for analysis queries.
- Analyze the user's real data provided above.
- NEVER fabricate tasks, completion states, priorities, dates, streaks, or statistics.
- Handle empty data gracefully:
  - If no checklists exist: "## 📋 Workspace\n\nYou don't have any checklists yet. Create your first checklist to get started."
  - If no tasks exist: "## 📋 Workspace\n\nYour checklists don't contain any tasks yet."
- If priority information exists, use it. If not, do not invent priority values.

============================================================
4. RESPONSE FORMATTING & MARKDOWN RULES
============================================================
- Format all text in clean, standard Markdown.
- NEVER output raw HTML (<br>, <div>, <span>, etc.).
- Use headings (##, ###), bold text, bullet lists, and numbered lists where appropriate.
- When listing tasks, use clear bullets:
  - 🔴 **High** — Task title (only if priority exists)
  - 🟡 **Medium** — Task title
  - 🟢 **Low** — Task title
- When displaying Completed vs Pending tasks, clearly separate them under distinct headings.
- For 25-minute focus block requests, group related tasks logically into distinct blocks:
  ### 💻 Focus Blocks
  **Block 1 — Backend Setup**
  - Task 1
  - Task 2
- When to use Markdown Tables:
  - Use tables when comparing structured metrics across checklists, productivity summaries, or progress breakdowns.
  - Ensure all rows have equal column counts and concise cell text.
  - Never put raw HTML in table cells.
  Example Productivity Summary:
  ## 📊 Productivity Summary
  | Metric | Value |
  |---|---:|
  | Total Tasks | 20 |
  | Completed | 14 |
  | Remaining | 6 |
  | Completion | 70% |

Be concise, practical, and action-oriented!`,
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

import { Router } from "express";
import Groq from "groq-sdk";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const aiRoutes = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// manager only
aiRoutes.use(requireAuth, requireRole("manager"));

// POST /api/v1/ai/chat
// body: { question: string, weekStart?: string, weekEnd?: string }
aiRoutes.post("/chat", async (req, res, next) => {
  try {
    const { question, weekStart, weekEnd } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: { message: "A question is required" } });
    }

    // pull the relevant reports as context - default to last 2 weeks if no range given
    let whereClause = "WHERE 1=1";
    const params = [];
    if (weekStart) {
      whereClause += " AND r.week_start >= ?";
      params.push(weekStart);
    }
    if (weekEnd) {
      whereClause += " AND r.week_end <= ?";
      params.push(weekEnd);
    }

    const [reports] = await pool.query(
      `SELECT u.name AS member, p.name AS project, r.week_start, r.week_end, r.status,
              r.tasks_completed, r.blockers, r.achievements
       FROM reports r
       JOIN users u ON u.id = r.user_id
       JOIN projects p ON p.id = r.project_id
       ${whereClause}
       ORDER BY r.week_start DESC
       LIMIT 50`,
      params
    );

    if (reports.length === 0) {
      return res.json({ data: { answer: "There are no reports matching that period yet." } });
    }

    // build a compact, readable context block from the report data
    const contextText = reports
      .map((r) => {
        const tasks = (r.tasks_completed || []).map((t) => t.task).join(", ") || "none";
        const blockers = (r.blockers || []).map((b) => b.text).join(", ") || "none";
        const achievements = (r.achievements || []).map((a) => a.text).join(", ") || "none";
        return `- ${r.member} (${r.project}, week ${r.week_start} to ${r.week_end}, status: ${r.status}): tasks: ${tasks}. blockers: ${blockers}. achievements: ${achievements}.`;
      })
      .join("\n");

    const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
        {
          role: "system",
          content:
            "You are an assistant helping a manager understand their team's weekly reports. " +
            "Answer only using the report data provided. Be concise and specific. " +
            "If the data doesn't answer the question, say so plainly.",
        },
        {
          role: "user",
          content: `Report data:\n${contextText}\n\nQuestion: ${question}`,
        },
      ],
  temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "No answer generated.";

    res.json({ data: { answer } });
  } catch (err) {
    next(err);
  }
});

export default aiRoutes;
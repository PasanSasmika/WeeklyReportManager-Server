import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const dashboardRoutes = Router();

// all dashboard routes require a manager
dashboardRoutes.use(requireAuth, requireRole("manager"));


dashboardRoutes.get("/summary", async (req, res, next) => {
  try {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: { message: "weekStart and weekEnd are required" } });
    }

    // all reports that belong to this week
    const [reportsThisWeek] = await pool.query(
      "SELECT * FROM reports WHERE week_start = ? AND week_end = ?",
      [weekStart, weekEnd]
    );

    // total number of team members, to work out who hasn't submitted yet
    const [teamMembers] = await pool.query(
      "SELECT id FROM users WHERE role = 'team_member'"
    );

    const totalMembers = teamMembers.length;
    const submittedCount = reportsThisWeek.filter(r => r.status !== "draft").length;
    const complianceRate = totalMembers === 0 ? 0 : Math.round((submittedCount / totalMembers) * 100);
    const needsCorrectionCount = reportsThisWeek.filter(r => r.status === "needs_correction").length;

    // count key blockers across this week's reports that are still open (not approved yet)
    let openBlockers = 0;
    for (const report of reportsThisWeek) {
      if (report.status === "approved") continue;
      const blockers = report.blockers || [];
      openBlockers += blockers.length;
    }

    res.json({
      data: {
        reportsSubmitted: submittedCount,
        totalTeamMembers: totalMembers,
        complianceRate,
        needsCorrectionCount,
        openBlockers,
      },
    });
  } catch (err) {
    next(err);
  }
});

dashboardRoutes.get("/charts/tasks-trend", async (req, res, next) => {
  try {
    const weeksToShow = parseInt(req.query.weeks) || 6;

    const [reports] = await pool.query(
      "SELECT week_start, tasks_completed FROM reports ORDER BY week_start DESC LIMIT ?",
      [weeksToShow * 20]
    );

    const countsByWeek = {};
    for (const report of reports) {
      const tasks = report.tasks_completed || [];
      const doneCount = tasks.filter(t => t.status === "done").length;
      const key = report.week_start.toISOString().slice(0, 10);
      countsByWeek[key] = (countsByWeek[key] || 0) + doneCount;
    }

    const result = Object.entries(countsByWeek)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-weeksToShow)
      .map(([week, count]) => ({ week, tasksCompleted: count }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

dashboardRoutes.get("/charts/status-by-member", async (req, res, next) => {
  try {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: { message: "weekStart and weekEnd are required" } });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, r.status
       FROM users u
       LEFT JOIN reports r ON r.user_id = u.id AND r.week_start = ? AND r.week_end = ?
       WHERE u.role = 'team_member'`,
      [weekStart, weekEnd]
    );

    const result = rows.map(row => ({
      memberName: row.name,
      status: row.status || "not_started",
    }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

dashboardRoutes.get("/charts/workload-by-project", async (req, res, next) => {
  try {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: { message: "weekStart and weekEnd are required" } });
    }

    const [reports] = await pool.query(
      `SELECT r.tasks_completed, p.name AS project_name
       FROM reports r
       JOIN projects p ON p.id = r.project_id
       WHERE r.week_start = ? AND r.week_end = ?`,
      [weekStart, weekEnd]
    );

    const countsByProject = {};
    for (const report of reports) {
      const tasks = report.tasks_completed || [];
      countsByProject[report.project_name] = (countsByProject[report.project_name] || 0) + tasks.length;
    }

    const result = Object.entries(countsByProject).map(([project, taskCount]) => ({
      project,
      taskCount,
    }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

dashboardRoutes.get("/charts/time-by-type", async (req, res, next) => {
  try {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: { message: "weekStart and weekEnd are required" } });
    }

    const [reports] = await pool.query(
      "SELECT hours_breakdown FROM reports WHERE week_start = ? AND week_end = ?",
      [weekStart, weekEnd]
    );

    const hoursByType = {};
    for (const report of reports) {
      const breakdown = report.hours_breakdown || [];
      for (const entry of breakdown) {
        hoursByType[entry.type] = (hoursByType[entry.type] || 0) + Number(entry.hours || 0);
      }
    }

    const result = Object.entries(hoursByType).map(([type, hours]) => ({ type, hours }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

dashboardRoutes.get("/activity", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);

    const [comments] = await pool.query(
      `SELECT c.action, c.comment, c.created_at, u.name AS manager_name, ru.name AS member_name
       FROM review_comments c
       JOIN users u ON u.id = c.manager_id
       JOIN reports r ON r.id = c.report_id
       JOIN users ru ON ru.id = r.user_id
       ORDER BY c.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const activity = comments.map(c => ({
      type: c.action,
      message:
        c.action === "approved"
          ? `${c.manager_name} approved ${c.member_name}'s report`
          : `${c.manager_name} requested changes on ${c.member_name}'s report`,
      timestamp: c.created_at,
    }));

    res.json({ data: activity });
  } catch (err) {
    next(err);
  }
});

export default dashboardRoutes;
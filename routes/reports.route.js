import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const reportRoutes = Router();

async function getOwnReport(reportId, userId) {
  const [rows] = await pool.query(
    "SELECT * FROM reports WHERE id = ? AND user_id = ?",
    [reportId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

reportRoutes.post("/", requireAuth, requireRole("team_member"), async (req, res, next) => {
  try {
    const {
      projectId,
      weekStart,
      weekEnd,
      tasksCompleted = [],
      tasksPlannedNext = "",
      blockers = [],
      achievements = [],
      hoursBreakdown = [],
      notes = "",
    } = req.body;

    if (!projectId || !weekStart || !weekEnd) {
      return res.status(400).json({
        error: { message: "projectId, weekStart and weekEnd are required" },
      });
    }

    const [result] = await pool.query(
      `INSERT INTO reports
        (user_id, project_id, week_start, week_end, tasks_completed, tasks_planned_next, blockers, achievements, hours_breakdown, notes, status, current_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)`,
      [
        req.user.id,
        projectId,
        weekStart,
        weekEnd,
        JSON.stringify(tasksCompleted),
        tasksPlannedNext,
        JSON.stringify(blockers),
        JSON.stringify(achievements),
        JSON.stringify(hoursBreakdown),
        notes,
      ]
    );

    res.status(201).json({ data: { id: result.insertId, status: "draft" } });
  } catch (err) {
    next(err);
  }
});


reportRoutes.get("/", requireAuth, requireRole("team_member"), async (req, res, next) => {
  try {
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "week_start";
    const order = req.query.order || "desc";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const allowedSortColumns = ["week_start", "created_at", "status"];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : "week_start";
    const sortDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(limit, 50);
    const offset = (safePage - 1) * safeLimit;

    // build the WHERE clause dynamically based on whether a status filter was given
    let whereClause = "WHERE user_id = ?";
    const params = [req.user.id];

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    const [reports] = await pool.query(
      `SELECT * FROM reports ${whereClause} ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM reports ${whereClause}`,
      params
    );

    res.json({
      data: reports,
      meta: { page: safePage, limit: safeLimit, total: countResult[0].total },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// GET a single own report (with its latest review comment, if any)
// -----------------------------
reportRoutes.get("/:id", requireAuth, requireRole("team_member"), async (req, res, next) => {
  try {
    const report = await getOwnReport(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: { message: "Report not found" } });
    }

    const [comments] = await pool.query(
      "SELECT * FROM review_comments WHERE report_id = ? ORDER BY created_at DESC LIMIT 1",
      [report.id]
    );

    res.json({ data: { ...report, latestComment: comments[0] || null } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// UPDATE own report — only allowed while draft or needs_correction
// -----------------------------
reportRoutes.put("/:id", requireAuth, requireRole("team_member"), async (req, res, next) => {
  try {
    const report = await getOwnReport(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: { message: "Report not found" } });
    }

    if (report.status !== "draft" && report.status !== "needs_correction") {
      return res.status(400).json({
        error: { message: "Only draft or needs_correction reports can be edited" },
      });
    }

    const {
      projectId,
      weekStart,
      weekEnd,
      tasksCompleted = [],
      tasksPlannedNext = "",
      blockers = [],
      achievements = [],
      hoursBreakdown = [],
      notes = "",
    } = req.body;

    await pool.query(
      `UPDATE reports SET
        project_id = ?, week_start = ?, week_end = ?, tasks_completed = ?,
        tasks_planned_next = ?, blockers = ?, achievements = ?, hours_breakdown = ?, notes = ?
       WHERE id = ?`,
      [
        projectId,
        weekStart,
        weekEnd,
        JSON.stringify(tasksCompleted),
        tasksPlannedNext,
        JSON.stringify(blockers),
        JSON.stringify(achievements),
        JSON.stringify(hoursBreakdown),
        notes,
        report.id,
      ]
    );

    res.json({ data: { id: report.id, status: report.status } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// SUBMIT own report — draft/needs_correction -> submitted
// Also saves a snapshot into report_versions (this is our version history)
// -----------------------------
reportRoutes.post("/:id/submit", requireAuth, requireRole("team_member"), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const report = await getOwnReport(req.params.id, req.user.id);
    if (!report) {
      connection.release();
      return res.status(404).json({ error: { message: "Report not found" } });
    }

    if (report.status !== "draft" && report.status !== "needs_correction") {
      connection.release();
      return res.status(400).json({
        error: { message: "Only draft or needs_correction reports can be submitted" },
      });
    }

    const nextVersion = report.current_version + 1 - (report.status === "draft" ? 1 : 0);
    // if this is the very first submit (from draft), version stays at current_version (1)
    // if resubmitting after correction, version increments

    await connection.beginTransaction();

    // 1. save a snapshot of the report content as it stands right now
    await connection.query(
      "INSERT INTO report_versions (report_id, version_no, snapshot) VALUES (?, ?, ?)",
      [
        report.id,
        nextVersion,
        JSON.stringify({
          weekStart: report.week_start,
          weekEnd: report.week_end,
          projectId: report.project_id,
          tasksCompleted: report.tasks_completed,
          tasksPlannedNext: report.tasks_planned_next,
          blockers: report.blockers,
          achievements: report.achievements,
          hoursBreakdown: report.hours_breakdown,
          notes: report.notes,
        }),
      ]
    );

    // 2. flip status to submitted and update the version number
    await connection.query(
      "UPDATE reports SET status = 'submitted', current_version = ? WHERE id = ?",
      [nextVersion, report.id]
    );
await pool.query(
  "INSERT INTO audit_log (actor_id, action, target_id, details) VALUES (?, ?, ?, ?)",
  [req.user.id, "report_submitted", report.id, `Week ${report.week_start}`]
);
    await connection.commit();
    res.json({ data: { id: report.id, status: "submitted", version: nextVersion } });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
  await connection.commit();
});

// -----------------------------
// GET version history for own report
// -----------------------------
reportRoutes.get("/:id/versions", requireAuth, requireRole("team_member"), async (req, res, next) => {
  try {
    const report = await getOwnReport(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: { message: "Report not found" } });
    }

    const [versions] = await pool.query(
      "SELECT * FROM report_versions WHERE report_id = ? ORDER BY version_no DESC",
      [report.id]
    );

    res.json({ data: versions });
  } catch (err) {
    next(err);
  }
});


// -----------------------------
// LIST all team reports — manager only (with filters, sort, pagination)
// Example: GET /api/v1/reports/team?status=submitted&projectId=1&userId=3&sortBy=week_start&order=desc&page=1&limit=10
// -----------------------------
reportRoutes.get("/team/all", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { status = "", projectId = "", userId = "", weekStart = "", weekEnd = "" } = req.query;
    const sortBy = req.query.sortBy || "week_start";
    const order = req.query.order || "desc";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const allowedSortColumns = ["week_start", "created_at", "status"];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : "week_start";
    const sortDirection = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(limit, 50);
    const offset = (safePage - 1) * safeLimit;

    // build WHERE clause dynamically based on which filters were provided
    let whereClause = "WHERE 1=1";
    const params = [];

    if (status) {
      whereClause += " AND r.status = ?";
      params.push(status);
    }
    if (projectId) {
      whereClause += " AND r.project_id = ?";
      params.push(projectId);
    }
    if (userId) {
      whereClause += " AND r.user_id = ?";
      params.push(userId);
    }
    if (weekStart) {
      whereClause += " AND r.week_start >= ?";
      params.push(weekStart);
    }
    if (weekEnd) {
      whereClause += " AND r.week_end <= ?";
      params.push(weekEnd);
    }

    // join users and projects so the dashboard gets names, not just ids
    const [reports] = await pool.query(
      `SELECT r.*, u.name AS user_name, p.name AS project_name
       FROM reports r
       JOIN users u ON u.id = r.user_id
       JOIN projects p ON p.id = r.project_id
       ${whereClause}
       ORDER BY r.${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM reports r ${whereClause}`,
      params
    );

    res.json({
      data: reports,
      meta: { page: safePage, limit: safeLimit, total: countResult[0].total },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// GET a single report (any team member's) — manager only
// Includes version history and all past review comments
// -----------------------------
reportRoutes.get("/team/:id", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS user_name, p.name AS project_name
       FROM reports r
       JOIN users u ON u.id = r.user_id
       JOIN projects p ON p.id = r.project_id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: { message: "Report not found" } });
    }

    const [versions] = await pool.query(
      "SELECT * FROM report_versions WHERE report_id = ? ORDER BY version_no DESC",
      [req.params.id]
    );

    const [comments] = await pool.query(
      `SELECT c.*, u.name AS manager_name
       FROM review_comments c
       JOIN users u ON u.id = c.manager_id
       WHERE c.report_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );

    res.json({ data: { ...rows[0], versions, comments } });
  } catch (err) {
    next(err);
  }
});


reportRoutes.post("/team/:id/review", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { action, comment = "" } = req.body;

    if (action !== "approved" && action !== "changes_requested") {
      return res.status(400).json({
        error: { message: "action must be 'approved' or 'changes_requested'" },
      });
    }
    if (action === "changes_requested" && comment.trim() === "") {
      return res.status(400).json({
        error: { message: "A comment is required when requesting changes" },
      });
    }

    const [rows] = await pool.query("SELECT * FROM reports WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: "Report not found" } });
    }
    const report = rows[0];

    if (report.status !== "submitted") {
      return res.status(400).json({
        error: { message: "Only submitted reports can be reviewed" },
      });
    }

    const newStatus = action === "approved" ? "approved" : "needs_correction";

    // record the comment against the version currently under review
    await pool.query(
      "INSERT INTO review_comments (report_id, version_no, manager_id, action, comment) VALUES (?, ?, ?, ?, ?)",
      [report.id, report.current_version, req.user.id, action, comment]
    );

    await pool.query("UPDATE reports SET status = ? WHERE id = ?", [newStatus, report.id]);
    await pool.query(
  "INSERT INTO audit_log (actor_id, action, target_id, details) VALUES (?, 'user_created', ?, ?)",
  [req.user.id, result.insertId, `${name} (${role})`]
);
    res.json({ data: { id: report.id, status: newStatus } });
  } catch (err) {
    next(err);
  }
});

export default reportRoutes;
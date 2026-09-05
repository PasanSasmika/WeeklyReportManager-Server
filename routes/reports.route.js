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

    await connection.commit();
    res.json({ data: { id: report.id, status: "submitted", version: nextVersion } });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
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

export default reportRoutes;
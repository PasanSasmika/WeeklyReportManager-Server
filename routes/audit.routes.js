import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const auditRoutes = Router();

// manager only
auditRoutes.use(requireAuth, requireRole("manager"));

// GET /api/v1/audit?page=1&limit=20
auditRoutes.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT a.*, u.name AS actor_name
       FROM audit_log a
       JOIN users u ON u.id = a.actor_id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.query("SELECT COUNT(*) AS total FROM audit_log");

    res.json({ data: rows, meta: { page, limit, total: countResult[0].total } });
  } catch (err) {
    next(err);
  }
});

export default auditRoutes;
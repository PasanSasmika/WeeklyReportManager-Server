import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const projectRoutes = Router();


projectRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "name";
    const order = req.query.order || "asc";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const allowedSortColumns = ["name", "created_at"];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : "name";
    const sortDirection = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    const safePage = Math.max(page, 1);       
    const safeLimit = Math.min(limit, 50);    
    const offset = (safePage - 1) * safeLimit;

    
    const [projects] = await pool.query(
      `SELECT * FROM projects WHERE name LIKE ? ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
      [`%${search}%`, safeLimit, offset]
    );

    
    const [countResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM projects WHERE name LIKE ?",
      [`%${search}%`]
    );

    res.json({
      data: projects,
      meta: { page: safePage, limit: safeLimit, total: countResult[0].total },
    });
  } catch (err) {
    next(err); // sends error to the centralized error handler in server.js
  }
});

// -----------------------------
// GET a single project by id
// -----------------------------
projectRoutes.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const [projects] = await pool.query("SELECT * FROM projects WHERE id = ?", [req.params.id]);

    if (projects.length === 0) {
      return res.status(404).json({ error: { message: "Project not found" } });
    }

    res.json({ data: projects[0] });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// CREATE a project — manager only
// -----------------------------
projectRoutes.post("/", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { name, description = "" } = req.body;

    // basic validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: { message: "Project name is required" } });
    }

    const [result] = await pool.query(
      "INSERT INTO projects (name, description) VALUES (?, ?)",
      [name.trim(), description]
    );

    res.status(201).json({
      data: { id: result.insertId, name: name.trim(), description },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// UPDATE a project — manager only
// -----------------------------
projectRoutes.put("/:id", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: { message: "Project name is required" } });
    }

    const [result] = await pool.query(
      "UPDATE projects SET name = ?, description = ? WHERE id = ?",
      [name.trim(), description, req.params.id]
    );

    // affectedRows tells us if a project with that id actually existed
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: "Project not found" } });
    }

    res.json({ data: { id: Number(req.params.id), name: name.trim(), description } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// DELETE a project — manager only
// -----------------------------
projectRoutes.delete("/:id", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    // safety check: don't delete a project that still has reports using it
    const [reportsUsingThisProject] = await pool.query(
      "SELECT id FROM reports WHERE project_id = ? LIMIT 1",
      [req.params.id]
    );

    if (reportsUsingThisProject.length > 0) {
      return res.status(400).json({
        error: { message: "Cannot delete a project that has reports attached to it" },
      });
    }

    const [result] = await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: "Project not found" } });
    }

    res.json({ data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
});

export default projectRoutes;
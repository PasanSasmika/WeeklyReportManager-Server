import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const userRoutes = Router();

// all routes in this file require a manager
userRoutes.use(requireAuth, requireRole("manager"));

// -----------------------------
// LIST all users (with search, role filter, pagination)
// -----------------------------
userRoutes.get("/", async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const role = req.query.role || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(limit, 50);
    const offset = (safePage - 1) * safeLimit;

    let whereClause = "WHERE name LIKE ?";
    const params = [`%${search}%`];

    if (role) {
      whereClause += " AND role = ?";
      params.push(role);
    }

    // never select the password column
    const [users] = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );

    res.json({
      data: users,
      meta: { page: safePage, limit: safeLimit, total: countResult[0].total },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// CREATE (invite) a new user directly — manager sets name, email, role, temp password
// This is separate from the public /auth/register — this one lets a manager add
// a team member on their behalf.
// -----------------------------
userRoutes.post("/", async (req, res, next) => {
  try {
    const { name, email, password, role = "team_member" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: "Name, email and password are required" } });
    }
    if (role !== "team_member" && role !== "manager") {
      return res.status(400).json({ error: { message: "Role must be team_member or manager" } });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: { message: "Email already registered" } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ data: { id: result.insertId, name, email, role } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// UPDATE a user's role
// -----------------------------
userRoutes.put("/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;

    if (role !== "team_member" && role !== "manager") {
      return res.status(400).json({ error: { message: "Role must be team_member or manager" } });
    }

    const [result] = await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    res.json({ data: { id: Number(req.params.id), role } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// DELETE (remove) a user
// -----------------------------
userRoutes.delete("/:id", async (req, res, next) => {
  try {
    // prevent a manager from deleting their own account by mistake
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: { message: "You cannot remove your own account" } });
    }

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    res.json({ data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
});


userRoutes.get("/:id", async (req, res, next) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    res.json({ data: users[0] });
  } catch (err) {
    next(err);
  }
});

export default userRoutes;
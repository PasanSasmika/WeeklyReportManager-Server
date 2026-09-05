import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const authRoutes = Router();

// POST /api/v1/auth/register
authRoutes.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: "Name, email and password are required" } });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: { message: "Password must be at least 6 characters" } });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: { message: "Email already registered" } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalRole = role === "manager" ? "manager" : "team_member"; // default safe role

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, finalRole]
    );

    res.status(201).json({
      data: { id: result.insertId, name, email, role: finalRole },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
authRoutes.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: "Email and password are required" } });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default authRoutes;
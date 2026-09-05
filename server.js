import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import reportRoutes from "./routes/reports.route.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/users.routes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const API_BASE = "/api/v1";

app.get(`${API_BASE}/health`, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({ status: "ok", db: rows[0].result === 1 });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});





app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/projects`, projectRoutes);
app.use(`${API_BASE}/report`, reportRoutes);
app.use(`${API_BASE}/dashboard`, dashboardRoutes);
app.use(`${API_BASE}/users`, userRoutes);




// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

// centralized error handler - every route's next(err) lands here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: { message: err.message || "Internal server error" },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
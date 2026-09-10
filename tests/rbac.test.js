import request from "supertest";
import app from "../app.js";
import pool from "../db.js";

let managerToken;
let memberToken;
let memberTwoToken;

beforeAll(async () => {
  const managerLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "alice@example.com", password: "password123" });
  managerToken = managerLogin.body.data.token;

  const memberLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "nimal@example.com", password: "password123" });
  memberToken = memberLogin.body.data.token;

  const memberTwoLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "kasun@example.com", password: "password123" });
  memberTwoToken = memberTwoLogin.body.data.token;
});

afterAll(async () => {
  await pool.end();
});

describe("Role-based access control", () => {
  test("team member CANNOT access the manager-only team reports list", async () => {
    const res = await request(app)
      .get("/api/v1/report/team/all")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  test("team member CANNOT create a project (manager-only)", async () => {
    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Unauthorized Project" });

    expect(res.status).toBe(403);
  });

  test("team member CANNOT access user management endpoints", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  test("manager CAN access the team reports list", async () => {
    const res = await request(app)
      .get("/api/v1/report/team/all")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
  });

  test("a team member cannot access another team member's own report by id", async () => {
    const createRes = await request(app)
      .post("/api/v1/report")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        projectId: 1,
        weekStart: "2026-09-01",
        weekEnd: "2026-09-07",
        tasksCompleted: [],
      });

    const reportId = createRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/report/${reportId}`)
      .set("Authorization", `Bearer ${memberTwoToken}`);

    expect(res.status).toBe(404);
  });

  test("request with no token is rejected", async () => {
    const res = await request(app).get("/api/v1/report");
    expect(res.status).toBe(401);
  });

  test("request with an invalid token is rejected", async () => {
    const res = await request(app)
      .get("/api/v1/report")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(401);
  });
});
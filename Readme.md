# Weekly Report Generator & Team Dashboard

A full-stack app for team members to submit weekly work reports and managers to review, approve, and track them across the team.

**Stack:** React + TypeScript + Tailwind CSS (frontend) · Node.js + Express (backend) · MySQL (database) · Groq (AI assistant)

---

## Repositories

This project is split into two repos:

- **server:** `https://github.com/PasanSasmika/WeeklyReportManager-Server.git`
- **Frontend:** `https://github.com/PasanSasmika/WeeklyReportManager-Frontend.git`

Clone both into the same parent folder:

```bash
git clone https://github.com/PasanSasmika/WeeklyReportManager-Server.git
git clone https://github.com/PasanSasmika/WeeklyReportManager-Frontend.git
```

You should end up with:

weekly-reports/
├── server/
└── frontend/




---

## 1. Database setup

Requires MySQL installed and running locally.

```bash
mysql -u root -p
```

Inside the MySQL shell:

```sql
CREATE DATABASE weekly_reports;
EXIT;
```

Load the schema:

```bash
cd server
mysql -u root -p weekly_reports < schema.sql
```

(Optional) Load seed data — sample users

```bash
mysql -u root -p weekly_reports < seed.sql
```

> Seeded users log in with password `password123`. If login fails, regenerate a fresh bcrypt hash and replace it in `seed.sql` before re-running:
> ```bash
> node generateHash.js password123
> ```

---

## 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:
Copy The Environment veriables from .env.example and paste them to .env. 



> Get a free Groq API key at [console.groq.com](https://console.groq.com).

Run the backend:

```bash
npm run dev
```

Confirm it's working:

```bash
curl http://localhost:5000/api/v1/health
```

Expected response: `{"status":"ok","db":true}`

---

## 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
Copy The Environment veriables from .env.example and past them to .env. 
Paste backend URL: VITE_API_URL=http://localhost:5000/api/v1


Run the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 4. Logging in

- **Manager:** `alice@example.com` / `password123`
- **Team member:** `nimal@example.com` / `password123` (or `kasun@example.com`)

New team members can also self-register via the Register page.

---

## 5. Try the AI assistant

Log in as a manager, open the dashboard, click **"Ask about your team"** in the bottom-right corner, and try:

1. *"What did the team work on last week?"*
2. *"What are the recurring blockers across the team?"*
3. *"Summarize the team's key achievements this week."*

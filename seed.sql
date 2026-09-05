USE weekly_reports;

INSERT INTO users (name, email, password, role) VALUES
('Alice Perera', 'alice@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'manager'),
('Nimal Silva', 'nimal@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Kasun Fernando', 'kasun@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Sanduni Jayasuriya', 'sanduni@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Ruwan Bandara', 'ruwan@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member');

INSERT INTO projects (name, description) VALUES
('Client A', 'External client project'),
('Internal Tooling', 'Internal dashboards and tools'),
('R&D', 'Research and prototyping');

INSERT INTO reports (user_id, project_id, week_start, week_end, tasks_completed, tasks_planned_next, blockers, achievements, hours_breakdown, notes, status, current_version) VALUES
(2, 1, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','API integration','priority','high','plannedPct',100,'actualPct',100,'status','done','timePlanned',8,'timeSpent',9,'output','Merged PR #45')),
 'Start on reporting module',
 JSON_ARRAY(JSON_OBJECT('text','Waiting on API keys','isKey', true)),
 JSON_ARRAY(JSON_OBJECT('text','Finished integration early','isKey', true)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',30), JSON_OBJECT('type','Meetings','hours',5)),
 'No additional notes',
 'approved', 1),

(3, 2, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Dashboard UI','priority','medium','plannedPct',80,'actualPct',60,'status','in_progress','timePlanned',10,'timeSpent',7,'output','WIP branch')),
 'Finish dashboard charts',
 JSON_ARRAY(JSON_OBJECT('text','Design not finalized','isKey', true)),
 JSON_ARRAY(JSON_OBJECT('text','Set up chart library','isKey', false)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',25)),
 '',
 'needs_correction', 1),

(4, 1, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Testing','priority','high','plannedPct',100,'actualPct',90,'status','in_progress','timePlanned',12,'timeSpent',10,'output','Test cases written')),
 'Complete regression testing',
 JSON_ARRAY(),
 JSON_ARRAY(JSON_OBJECT('text','All critical bugs fixed','isKey', true)),
 JSON_ARRAY(JSON_OBJECT('type','Testing','hours',20), JSON_OBJECT('type','Documentation','hours',3)),
 '',
 'submitted', 1);

INSERT INTO review_comments (report_id, version_no, manager_id, action, comment) VALUES
(2, 1, 1, 'changes_requested', 'Please add planned vs actual hours breakdown for the dashboard task.');
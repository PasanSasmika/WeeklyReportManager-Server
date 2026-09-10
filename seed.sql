USE weekly_reports;


INSERT INTO users (name, email, password, role) VALUES
('Alice Perera', 'alice@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'manager'),
('Nimal Silva', 'nimal@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Kasun Fernando', 'kasun@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Sanduni Jayasuriya', 'sanduni@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Ruwan Bandara', 'ruwan@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Tharindu Wickrama', 'tharindu@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member');

-- ============================================
-- PROJECTS
-- ============================================
INSERT INTO projects (name, description) VALUES
('Client A', 'External client project'),
('Internal Tooling', 'Internal dashboards and tools'),
('R&D', 'Research and prototyping');



-- ---- Week 1: Aug 11 - Aug 17 (all approved, oldest) ----
INSERT INTO reports (user_id, project_id, week_start, week_end, tasks_completed, tasks_planned_next, blockers, achievements, hours_breakdown, notes, status, current_version) VALUES
(2, 1, '2026-08-11', '2026-08-17',
 JSON_ARRAY(JSON_OBJECT('task','API integration','priority','high','plannedPct',100,'actualPct',100,'status','done','timePlanned',8,'timeSpent',8,'output','Merged PR #40')),
 'Start reporting module', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','Integration completed on time','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',32)), '', 'approved', 1),

(3, 2, '2026-08-11', '2026-08-17',
 JSON_ARRAY(JSON_OBJECT('task','Dashboard wireframes','priority','medium','plannedPct',100,'actualPct',100,'status','done','timePlanned',10,'timeSpent',9,'output','Figma link shared')),
 'Start dashboard build', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','Wireframes approved by team','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',20),JSON_OBJECT('type','Meetings','hours',6)), '', 'approved', 1),

(4, 1, '2026-08-11', '2026-08-17',
 JSON_ARRAY(JSON_OBJECT('task','Regression testing','priority','high','plannedPct',100,'actualPct',95,'status','done','timePlanned',12,'timeSpent',13,'output','Test report shared')),
 'Automate test suite', JSON_ARRAY(JSON_OBJECT('text','Flaky test environment','isKey',false)), JSON_ARRAY(JSON_OBJECT('text','Found 3 critical bugs before release','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Testing','hours',22)), '', 'approved', 1),

(5, 3, '2026-08-11', '2026-08-17',
 JSON_ARRAY(JSON_OBJECT('task','Literature review','priority','medium','plannedPct',100,'actualPct',100,'status','done','timePlanned',15,'timeSpent',14,'output','Summary doc')),
 'Prototype v1', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','Identified 2 viable approaches','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Documentation','hours',15)), '', 'approved', 1),

(6, 2, '2026-08-11', '2026-08-17',
 JSON_ARRAY(JSON_OBJECT('task','CI pipeline setup','priority','high','plannedPct',100,'actualPct',100,'status','done','timePlanned',10,'timeSpent',11,'output','Pipeline live')),
 'Add deployment stage', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','CI runtime reduced by 40%','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',18)), '', 'approved', 1);

INSERT INTO reports (user_id, project_id, week_start, week_end, tasks_completed, tasks_planned_next, blockers, achievements, hours_breakdown, notes, status, current_version) VALUES
(2, 1, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','Reporting module','priority','high','plannedPct',80,'actualPct',70,'status','in_progress','timePlanned',10,'timeSpent',9,'output','WIP branch')),
 'Finish reporting module', JSON_ARRAY(JSON_OBJECT('text','Waiting on API keys','isKey',true)), JSON_ARRAY(),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',28)), '', 'approved', 1),

(3, 2, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','Dashboard UI','priority','medium','plannedPct',80,'actualPct',60,'status','in_progress','timePlanned',10,'timeSpent',7,'output','WIP branch')),
 'Finish dashboard charts', JSON_ARRAY(JSON_OBJECT('text','Design not finalized','isKey',true)), JSON_ARRAY(JSON_OBJECT('text','Set up chart library','isKey',false)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',25)), '', 'needs_correction', 1),

(4, 1, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','Test automation','priority','high','plannedPct',90,'actualPct',85,'status','in_progress','timePlanned',12,'timeSpent',12,'output','Scripts in progress')),
 'Complete automation suite', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','Reduced manual testing time','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Testing','hours',24)), '', 'submitted', 1),

(5, 3, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','Prototype build','priority','medium','plannedPct',70,'actualPct',50,'status','in_progress','timePlanned',15,'timeSpent',10,'output','Early prototype')),
 'Iterate on prototype', JSON_ARRAY(JSON_OBJECT('text','Missing dataset access','isKey',true)), JSON_ARRAY(),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',12)), '', 'needs_correction', 1),

(6, 2, '2026-08-18', '2026-08-24',
 JSON_ARRAY(JSON_OBJECT('task','Deployment automation','priority','high','plannedPct',100,'actualPct',100,'status','done','timePlanned',8,'timeSpent',8,'output','Deploy script merged')),
 'Add rollback support', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','Zero-downtime deploys achieved','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',16)), '', 'submitted', 1);

INSERT INTO reports (user_id, project_id, week_start, week_end, tasks_completed, tasks_planned_next, blockers, achievements, hours_breakdown, notes, status, current_version) VALUES
(2, 1, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Reporting module polish','priority','medium','plannedPct',50,'actualPct',30,'status','in_progress','timePlanned',6,'timeSpent',4,'output','')),
 'Finalize and demo', JSON_ARRAY(), JSON_ARRAY(),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',12)), '', 'draft', 1),

(3, 2, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Dashboard charts','priority','medium','plannedPct',80,'actualPct',60,'status','in_progress','timePlanned',10,'timeSpent',7,'output','Chart library integrated')),
 'Finish dashboard charts with hours breakdown', JSON_ARRAY(JSON_OBJECT('text','Design not finalized','isKey',true)), JSON_ARRAY(JSON_OBJECT('text','Set up chart library','isKey',false)),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',25),JSON_OBJECT('type','Meetings','hours',3)), '', 'submitted', 2),

(4, 1, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Testing','priority','high','plannedPct',100,'actualPct',90,'status','in_progress','timePlanned',12,'timeSpent',10,'output','Test cases written')),
 'Complete regression testing', JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('text','All critical bugs fixed','isKey',true)),
 JSON_ARRAY(JSON_OBJECT('type','Testing','hours',20),JSON_OBJECT('type','Documentation','hours',3)), '', 'submitted', 1),

(5, 3, '2026-08-25', '2026-08-31',
 JSON_ARRAY(JSON_OBJECT('task','Prototype iteration','priority','medium','plannedPct',60,'actualPct',40,'status','in_progress','timePlanned',12,'timeSpent',8,'output','')),
 'Continue prototype work', JSON_ARRAY(JSON_OBJECT('text','Still missing dataset access','isKey',true)), JSON_ARRAY(),
 JSON_ARRAY(JSON_OBJECT('type','Development','hours',10)), '', 'needs_correction', 1);
 -- Tharindu (user 6) has NO report this week - shows as "not started" on the dashboard

INSERT INTO review_comments (report_id, version_no, manager_id, action, comment) VALUES
(7, 1, 1, 'changes_requested', 'Please add planned vs actual hours breakdown for the dashboard task.'),
(9, 1, 1, 'changes_requested', 'Need more detail on what dataset access is blocking - please specify which dataset and who owns it.'),
(14, 1, 1, 'changes_requested', 'Same blocker as last week - please escalate this to me directly instead of just noting it.'),
(1, 1, 1, 'approved', 'Great work, on track.'),
(2, 1, 1, 'approved', 'Wireframes look solid, approved.');


-- Get-Content .\seed.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p weekly_reports
-- mysql password
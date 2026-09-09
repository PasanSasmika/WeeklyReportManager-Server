USE weekly_reports;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('team_member', 'manager') NOT NULL DEFAULT 'team_member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  tasks_completed JSON,
  tasks_planned_next TEXT,
  blockers JSON,
  achievements JSON,
  hours_breakdown JSON,
  notes TEXT,
  status ENUM('draft', 'submitted', 'needs_correction', 'approved') NOT NULL DEFAULT 'draft',
  current_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE report_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  version_no INT NOT NULL,
  snapshot JSON NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE review_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  version_no INT NOT NULL,
  manager_id INT NOT NULL,
  action ENUM('approved', 'changes_requested') NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
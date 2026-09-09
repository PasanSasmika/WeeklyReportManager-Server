USE weekly_reports;

INSERT INTO users (name, email, password, role) VALUES
('Alice Perera', 'alice@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'manager'),
('Nimal Silva', 'nimal@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member'),
('Kasun Fernando', 'kasun@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q3v6yE2wOa4XLQ3rH2LZ5v6yPQK9K', 'team_member');

-- Password : password123
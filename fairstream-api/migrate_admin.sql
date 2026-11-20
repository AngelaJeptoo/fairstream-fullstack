USE fairstream;
ALTER TABLE users MODIFY role ENUM('listener','artist','admin') NOT NULL DEFAULT 'listener', ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active', ADD COLUMN last_login DATETIME NULL;
ALTER TABLE subscriptions ADD COLUMN source ENUM('paid','complimentary') NOT NULL DEFAULT 'paid', ADD COLUMN granted_by INT NULL;
CREATE TABLE audit_log (log_id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT NOT NULL, action VARCHAR(50) NOT NULL, target VARCHAR(255), detail VARCHAR(500), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (admin_id) REFERENCES users(user_id));
CREATE TABLE settlement_runs (run_id INT AUTO_INCREMENT PRIMARY KEY, period CHAR(7) NOT NULL, subscriptions INT NOT NULL, total_kes DECIMAL(10,2) NOT NULL, tx_hash VARCHAR(100), run_by INT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (run_by) REFERENCES users(user_id));

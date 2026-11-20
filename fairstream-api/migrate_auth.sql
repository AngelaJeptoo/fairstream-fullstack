USE fairstream;
CREATE TABLE password_resets (reset_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, token_hash CHAR(64) NOT NULL, expires_at DATETIME NOT NULL, used TINYINT(1) NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX (token_hash), FOREIGN KEY (user_id) REFERENCES users(user_id));

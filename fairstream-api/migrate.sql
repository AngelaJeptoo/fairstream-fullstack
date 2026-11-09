USE fairstream;
ALTER TABLE tracks ADD COLUMN description TEXT, ADD COLUMN cover_url VARCHAR(500);
CREATE TABLE track_splits (split_id INT AUTO_INCREMENT PRIMARY KEY, track_id INT NOT NULL, collaborator_name VARCHAR(100) NOT NULL, role VARCHAR(50) NOT NULL, wallet_address VARCHAR(42), percent DECIMAL(5,2) NOT NULL, FOREIGN KEY (track_id) REFERENCES tracks(track_id));

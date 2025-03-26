-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    google_id VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mood_records table
CREATE TABLE mood_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    primary_mood VARCHAR(50),
    specific_mood VARCHAR(50),
    reason VARCHAR(50),
    activity VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create chat_history table
CREATE TABLE chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    message TEXT,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Set initial admin user
INSERT INTO users (username, name, password, email, is_admin) 
VALUES ('admin', 'المدير', '$2y$10$5OlrGUzLqMNjLqpT/kLiGOYqOo2ZmfU6nZVU5S5MYa1X9z5MPjgc.', 'admin@example.com', TRUE); 
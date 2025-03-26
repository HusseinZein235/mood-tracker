<?php
/**
 * Database configuration file for local SQLite database
 * This file provides database connection and utility functions
 */

// Enable error reporting for debugging purposes
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database file location - store outside web root for security
define('DB_FILE', __DIR__ . '/../../data/moodmate.db');
define('DB_DIR', __DIR__ . '/../../data');

// Ensure data directory exists
if (!file_exists(DB_DIR)) {
    mkdir(DB_DIR, 0755, true);
}

/**
 * Get database connection
 * @return PDO The database connection
 */
function getDbConnection() {
    try {
        // Create database connection with error handling enabled
        $db = new PDO('sqlite:' . DB_FILE);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Initialize database tables if they don't exist
        initializeTables($db);
        
        return $db;
    } catch (PDOException $e) {
        // If this is an AJAX request, return JSON error
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }
        
        // Otherwise, show regular error
        die('Database connection failed: ' . $e->getMessage());
    }
}

/**
 * Initialize database tables if they don't exist
 * @param PDO $db Database connection
 */
function initializeTables($db) {
    // Users table
    $db->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        description TEXT,
        is_admin INTEGER DEFAULT 0,
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )');
    
    // Mood records table
    $db->exec('CREATE TABLE IF NOT EXISTS mood_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood_value INTEGER NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )');
    
    // Chat messages table
    $db->exec('CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )');
    
    // Check if admin user exists and create if not
    $stmt = $db->query("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    if ($stmt->fetchColumn() == 0) {
        // Create admin user (password: 12345678)
        $hashedPassword = password_hash('12345678', PASSWORD_DEFAULT);
        $db->exec("INSERT INTO users (username, name, password, email, is_admin) 
                  VALUES ('admin', 'المشرف', '$hashedPassword', 'admin@example.com', 1)");
    }
}

// Get a database connection to use in other files
$db = getDbConnection(); 
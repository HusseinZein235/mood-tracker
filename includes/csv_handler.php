<?php
/**
 * CSV Data Handler
 * Provides functions to work with CSV files as a database replacement
 */

// Define paths to CSV files
define('DATA_DIR', __DIR__ . '/../data');
define('USERS_CSV', DATA_DIR . '/users.csv');
define('MOOD_RECORDS_CSV', DATA_DIR . '/mood_records.csv');
define('CHAT_HISTORY_CSV', DATA_DIR . '/chat_history.csv');

// Ensure data directory exists
if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// Create CSV files with headers if they don't exist
function initialize_csv_files() {
    // Users CSV
    if (!file_exists(USERS_CSV)) {
        $users_header = ['id', 'username', 'name', 'password', 'email', 'google_id', 'is_admin', 'created_at', 'description'];
        save_csv_data(USERS_CSV, [$users_header]);
        
        // Add default admin user
        $admin_user = [
            1, 
            'admin', 
            'المدير', 
            '$2y$10$5OlrGUzLqMNjLqpT/kLiGOYqOo2ZmfU6nZVU5S5MYa1X9z5MPjgc.', 
            'admin@example.com', 
            '', 
            '1', 
            date('Y-m-d H:i:s'),
            ''
        ];
        append_csv_data(USERS_CSV, [$admin_user]);
    }
    
    // Mood Records CSV
    if (!file_exists(MOOD_RECORDS_CSV)) {
        $mood_header = ['id', 'user_id', 'primary_mood', 'specific_mood', 'reason', 'activity', 'notes', 'created_at'];
        save_csv_data(MOOD_RECORDS_CSV, [$mood_header]);
    }
    
    // Chat History CSV
    if (!file_exists(CHAT_HISTORY_CSV)) {
        $chat_header = ['id', 'user_id', 'message', 'response', 'created_at'];
        save_csv_data(CHAT_HISTORY_CSV, [$chat_header]);
    }
}

// Load CSV data from file
function load_csv_data($file_path) {
    if (!file_exists($file_path)) {
        return [];
    }
    
    $rows = [];
    if (($handle = fopen($file_path, "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $rows[] = $data;
        }
        fclose($handle);
    }
    
    return $rows;
}

// Save CSV data to file (overwrite)
function save_csv_data($file_path, $data) {
    if (($handle = fopen($file_path, "w")) !== FALSE) {
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
        return true;
    }
    
    return false;
}

// Append a single row to a CSV file
function append_csv_data($file_path, $data) {
    if (($handle = fopen($file_path, "a")) !== FALSE) {
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
        return true;
    }
    
    return false;
}

// User functions

// Get user by ID
function get_user_by_id($id) {
    $users = load_csv_data(USERS_CSV);
    if (empty($users)) return null;
    
    $header = array_shift($users); // Remove header row
    
    foreach ($users as $user) {
        if ($user[0] == $id) {
            return array_combine($header, $user);
        }
    }
    
    return null;
}

// Get user by username
function get_user_by_username($username) {
    $users = load_csv_data(USERS_CSV);
    if (empty($users)) return null;
    
    $header = array_shift($users); // Remove header row
    
    foreach ($users as $user) {
        if ($user[1] == $username) {
            return array_combine($header, $user);
        }
    }
    
    return null;
}

// Get user by email
function get_user_by_email($email) {
    $users = load_csv_data(USERS_CSV);
    if (empty($users)) return null;
    
    $header = array_shift($users); // Remove header row
    
    foreach ($users as $user) {
        if ($user[4] == $email) {
            return array_combine($header, $user);
        }
    }
    
    return null;
}

// Create new user
function create_user($username, $name, $password, $email = '', $description = '', $is_admin = 0) {
    $users = load_csv_data(USERS_CSV);
    $header = array_shift($users); // Remove header
    
    // Check if username exists
    foreach ($users as $user) {
        if ($user[1] == $username) {
            return ['status' => 'error', 'message' => 'اسم المستخدم مستخدم بالفعل'];
        }
        
        // Check if email exists and is not empty
        if (!empty($email) && $user[4] == $email) {
            return ['status' => 'error', 'message' => 'البريد الإلكتروني مستخدم بالفعل'];
        }
    }
    
    // Get next ID
    $next_id = 1;
    if (!empty($users)) {
        $next_id = max(array_column($users, 0)) + 1;
    }
    
    // Create new user
    $new_user = [
        $next_id,
        $username,
        $name,
        password_hash($password, PASSWORD_DEFAULT),
        $email,
        '', // google_id
        $is_admin,
        date('Y-m-d H:i:s'),
        $description
    ];
    
    // Append to CSV
    if (append_csv_data(USERS_CSV, [$new_user])) {
        return [
            'status' => 'success',
            'message' => 'تم التسجيل بنجاح',
            'user' => [
                'id' => $next_id,
                'username' => $username,
                'name' => $name,
                'description' => $description,
                'is_admin' => (bool)$is_admin
            ]
        ];
    } else {
        return ['status' => 'error', 'message' => 'فشل في إنشاء المستخدم'];
    }
}

// Mood record functions

// Get mood records for user
function get_mood_records($user_id) {
    $records = load_csv_data(MOOD_RECORDS_CSV);
    if (empty($records)) return [];
    
    $header = array_shift($records); // Remove header row
    
    $user_records = [];
    foreach ($records as $record) {
        if ($record[1] == $user_id) {
            $user_records[] = array_combine($header, $record);
        }
    }
    
    // Sort by created_at (newest first)
    usort($user_records, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    return $user_records;
}

// Save mood record
function save_mood_record($user_id, $primary_mood, $specific_mood, $reason, $activity, $notes = '') {
    $records = load_csv_data(MOOD_RECORDS_CSV);
    $header = array_shift($records); // Remove header
    
    // Get next ID
    $next_id = 1;
    if (!empty($records)) {
        $next_id = max(array_column($records, 0)) + 1;
    }
    
    // Create new record
    $new_record = [
        $next_id,
        $user_id,
        $primary_mood,
        $specific_mood,
        $reason,
        $activity,
        $notes,
        date('Y-m-d H:i:s')
    ];
    
    // Append to CSV
    if (append_csv_data(MOOD_RECORDS_CSV, [$new_record])) {
        return ['success' => true, 'message' => 'تم حفظ سجل المشاعر بنجاح'];
    } else {
        return ['success' => false, 'message' => 'فشل حفظ سجل المشاعر'];
    }
}

// Get mood statistics
function get_mood_statistics($user_id) {
    $records = get_mood_records($user_id);
    
    $moodStats = [
        'سعيد' => 0,
        'طبيعي' => 0,
        'حزين' => 0
    ];
    
    foreach ($records as $record) {
        if (isset($moodStats[$record['primary_mood']])) {
            $moodStats[$record['primary_mood']]++;
        }
    }
    
    // Calculate percentage
    $total = array_sum($moodStats);
    $percentages = [];
    
    if ($total > 0) {
        foreach ($moodStats as $mood => $count) {
            $percentages[$mood] = round(($count / $total) * 100);
        }
    }
    
    return [
        'counts' => $moodStats,
        'percentages' => $percentages,
        'total' => $total
    ];
}

// Chat history functions

// Save chat message
function save_chat_message($user_id, $message, $response) {
    $messages = load_csv_data(CHAT_HISTORY_CSV);
    $header = array_shift($messages); // Remove header
    
    // Get next ID
    $next_id = 1;
    if (!empty($messages)) {
        $next_id = max(array_column($messages, 0)) + 1;
    }
    
    // Create new message
    $new_message = [
        $next_id,
        $user_id,
        $message,
        $response,
        date('Y-m-d H:i:s')
    ];
    
    // Append to CSV
    return append_csv_data(CHAT_HISTORY_CSV, [$new_message]);
}

// Get chat history for user
function get_chat_history($user_id, $limit = 10) {
    $messages = load_csv_data(CHAT_HISTORY_CSV);
    if (empty($messages)) return [];
    
    $header = array_shift($messages); // Remove header row
    
    $user_messages = [];
    foreach ($messages as $message) {
        if ($message[1] == $user_id) {
            $user_messages[] = array_combine($header, $message);
        }
    }
    
    // Sort by created_at (newest first)
    usort($user_messages, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Apply limit
    $user_messages = array_slice($user_messages, 0, $limit);
    
    return $user_messages;
}

// Initialize CSV files
initialize_csv_files();
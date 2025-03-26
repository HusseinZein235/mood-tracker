<?php
// Script to fix CSV files and create proper data structure

// Create or recreate data directory
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
    echo "Created data directory.<br>";
}

// Define CSV file paths
define('USERS_CSV', $dataDir . '/users.csv');
define('MOOD_RECORDS_CSV', $dataDir . '/mood_records.csv');
define('CHAT_HISTORY_CSV', $dataDir . '/chat_history.csv');

// Function to save CSV data
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

// Recreate users.csv with proper structure
echo "Creating users.csv file...<br>";
$users_header = ['id', 'username', 'name', 'password', 'email', 'google_id', 'is_admin', 'created_at', 'description'];
$users_data = [$users_header];

// Add default admin user
$admin_user = [
    1, 
    'admin', 
    'المدير', 
    password_hash('12345678', PASSWORD_DEFAULT), 
    'admin@example.com', 
    '', 
    '1', 
    date('Y-m-d H:i:s'),
    ''
];
$users_data[] = $admin_user;

// Save users.csv
if (save_csv_data(USERS_CSV, $users_data)) {
    echo "Users CSV file created successfully with admin user.<br>";
} else {
    echo "Failed to create users CSV file.<br>";
}

// Recreate mood_records.csv with proper structure
echo "Creating mood_records.csv file...<br>";
$mood_header = ['id', 'user_id', 'primary_mood', 'specific_mood', 'reason', 'activity', 'notes', 'created_at'];
$mood_data = [$mood_header];

// Save mood_records.csv
if (save_csv_data(MOOD_RECORDS_CSV, $mood_data)) {
    echo "Mood records CSV file created successfully.<br>";
} else {
    echo "Failed to create mood records CSV file.<br>";
}

// Recreate chat_history.csv with proper structure
echo "Creating chat_history.csv file...<br>";
$chat_header = ['id', 'user_id', 'message', 'response', 'created_at'];
$chat_data = [$chat_header];

// Save chat_history.csv
if (save_csv_data(CHAT_HISTORY_CSV, $chat_data)) {
    echo "Chat history CSV file created successfully.<br>";
} else {
    echo "Failed to create chat history CSV file.<br>";
}

echo "<br>All CSV files have been created successfully. <a href='index.html'>Return to the application</a>";
?>

<?php
// This is a debug script to check CSV file contents and functionality

require_once 'includes/csv_handler.php';

echo "<h1>CSV Debug Information</h1>";

// Check if data directory exists
echo "<h2>Directory Structure</h2>";
echo "Data directory exists: " . (file_exists(__DIR__ . '/data') ? 'Yes' : 'No') . "<br>";
echo "Users CSV exists: " . (file_exists(USERS_CSV) ? 'Yes' : 'No') . "<br>";

// Show contents of users.csv
echo "<h2>Users CSV Contents</h2>";
echo "<pre>";
$users = load_csv_data(USERS_CSV);
print_r($users);
echo "</pre>";

// Test the user authentication
echo "<h2>Test Admin Login</h2>";
$admin = get_user_by_username('admin');
echo "Admin user found: " . ($admin ? 'Yes' : 'No') . "<br>";
if ($admin) {
    echo "<pre>";
    print_r($admin);
    echo "</pre>";
    
    // Test password verification
    $passwordVerifies = password_verify('12345678', $admin['password']);
    echo "Password verification: " . ($passwordVerifies ? 'Success' : 'Failed') . "<br>";
}

// Create a test admin if none exists
if (!$admin) {
    echo "<h3>Creating Test Admin</h3>";
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
    
    // Get existing data
    $users = load_csv_data(USERS_CSV);
    
    // If empty, add header
    if (empty($users)) {
        $header = ['id', 'username', 'name', 'password', 'email', 'google_id', 'is_admin', 'created_at', 'description'];
        $users = [$header];
    }
    
    // Add admin user
    $users[] = $admin_user;
    
    // Save back to CSV
    save_csv_data(USERS_CSV, $users);
    
    echo "Test admin created. Please refresh this page.";
}
?>

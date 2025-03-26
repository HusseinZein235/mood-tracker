<?php
// Setup script to initialize CSV-based system

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
    echo "Created data directory.\n";
}

// Create includes directory if it doesn't exist
$includesDir = __DIR__ . '/includes';
if (!file_exists($includesDir)) {
    mkdir($includesDir, 0755, true);
    echo "Created includes directory.\n";
}

// Create csv_handler.php file
$csvHandlerContent = <<<'EOT'
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
EOT;

file_put_contents($includesDir . '/csv_handler.php', $csvHandlerContent);
echo "Created CSV handler file.\n";

// Update auth.php
$authPhpContent = <<<'EOT'
<?php
// Start PHP session
session_start();

// Enable error reporting during development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug mode
$debug = true;

// Function to log debug info
function debug_log($message) {
    global $debug;
    if ($debug) {
        error_log($message);
    }
}

// Try to load CSV handler
try {
    // Load CSV handler
    require_once __DIR__ . '/includes/csv_handler.php';
    require_once __DIR__ . '/components/auth/login.php';
    require_once __DIR__ . '/components/auth/register.php';
    require_once __DIR__ . '/components/auth/session.php';
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => 'Failed to load data handler: ' . $e->getMessage()
    ];
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response);
    exit;
}

// Set content type for JSON
header('Content-Type: application/json; charset=utf-8');

// Get the action from POST data
$action = isset($_POST['action']) ? $_POST['action'] : '';

debug_log("Auth action received: " . $action);
debug_log("POST data: " . print_r($_POST, true));

// Handle different actions
try {
    switch ($action) {
        case 'login':
            $username = isset($_POST['username']) ? trim($_POST['username']) : '';
            $password = isset($_POST['password']) ? $_POST['password'] : '';
            
            debug_log("Login attempt: " . $username);
            
            if (empty($username) || empty($password)) {
                $response = [
                    'status' => 'error',
                    'message' => 'يرجى إدخال اسم المستخدم وكلمة المرور'
                ];
                debug_log("Login error: Empty username or password");
            } else {
                $response = login_user($username, $password);
                if ($response['status'] === 'success') {
                    debug_log("Login successful: " . $username);
                } else {
                    debug_log("Login failed: " . $response['message']);
                }
            }
            break;
    
        case 'register':
            $username = isset($_POST['username']) ? trim($_POST['username']) : '';
            $name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $password = isset($_POST['password']) ? $_POST['password'] : '';
            $email = isset($_POST['email']) ? trim($_POST['email']) : '';
            $description = isset($_POST['description']) ? trim($_POST['description']) : '';
            
            debug_log("Registration attempt: " . $username);
            
            $response = register_user($username, $name, $password, $email, $description);
            if ($response['status'] === 'success') {
                debug_log("Registration successful: " . $username);
            } else {
                debug_log("Registration failed: " . $response['message']);
            }
            break;
    
        case 'logout':
            debug_log("Logout attempt for: " . (isset($_SESSION['username']) ? $_SESSION['username'] : 'unknown user'));
            
            // Clear session data
            session_unset();
            session_destroy();
            
            $response = [
                'status' => 'success',
                'message' => 'تم تسجيل الخروج بنجاح'
            ];
            debug_log("Logout successful");
            break;
    
        case 'check_session':
            debug_log("Session check: " . print_r($_SESSION, true));
            
            if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
                // Verify that the user still exists
                $user = get_user_by_id($_SESSION['user_id']);
                
                if (!$user) {
                    // User no longer exists, invalidate session
                    session_unset();
                    session_destroy();
                    
                    $response = [
                        'status' => 'error',
                        'message' => 'جلسة المستخدم غير صالحة'
                    ];
                    debug_log("Session check: User ID not found");
                    break;
                }
                
                $response = [
                    'status' => 'success',
                    'message' => 'المستخدم مسجل الدخول',
                    'user' => [
                        'id' => $_SESSION['user_id'],
                        'username' => $_SESSION['username'],
                        'name' => $_SESSION['name'],
                        'description' => $_SESSION['description'] ?? '',
                        'is_admin' => $_SESSION['is_admin']
                    ]
                ];
                debug_log("Session check: User is logged in - " . $_SESSION['username']);
            } else {
                $response = [
                    'status' => 'error',
                    'message' => 'المستخدم غير مسجل الدخول'
                ];
                debug_log("Session check: User is not logged in");
            }
            break;
    
        default:
            $response = [
                'status' => 'error',
                'message' => 'إجراء غير معروف: ' . $action
            ];
            debug_log("Unknown action: " . $action);
    }
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => 'حدث خطأ غير متوقع: ' . $e->getMessage()
    ];
    debug_log("Unexpected error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
}

// Return response as JSON
echo json_encode($response);
?>
EOT;

file_put_contents(__DIR__ . '/auth.php', $authPhpContent);
echo "Updated auth.php file.\n";

// Update config.php
$configPhpContent = <<<'EOT'
<?php
header('Content-Type: text/html; charset=utf-8');

// Include CSV handler instead of using database
require_once __DIR__ . '/includes/csv_handler.php';

// No need for database connection anymore
?>
EOT;

file_put_contents(__DIR__ . '/config.php', $configPhpContent);
echo "Updated config.php file.\n";

// Update login.php
$loginPhpContent = <<<'EOT'
<?php
/**
 * Login functionality using CSV files
 */

/**
 * Authenticate a user with username and password
 * 
 * @param string $username Username
 * @param string $password Password
 * @return array Response with status and message
 */
function login_user($username, $password) {
    try {
        // Find user by username
        $user = get_user_by_username($username);
        
        // Check if user exists
        if (!$user) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ];
        }
        
        // Set session data for the authenticated user
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        $_SESSION['description'] = $user['description'] ?? '';
        
        return [
            'status' => 'success',
            'message' => 'تم تسجيل الدخول بنجاح',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'description' => $user['description'] ?? '',
                'is_admin' => (bool)$user['is_admin']
            ]
        ];
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'
        ];
    }
}
?>
EOT;

file_put_contents(__DIR__ . '/components/auth/login.php', $loginPhpContent);
echo "Updated login.php file.\n";

// Update register.php
$registerPhpContent = <<<'EOT'
<?php
/**
 * Registration functionality using CSV files
 */

/**
 * Register a new user
 * 
 * @param string $username Username
 * @param string $name Full name
 * @param string $password Password
 * @param string $email Email
 * @param string $description User description
 * @return array Response with status and message
 */
function register_user($username, $name, $password, $email, $description = '') {
    try {
        // Validate required fields
        if (empty($username) || empty($name) || empty($password)) {
            return [
                'status' => 'error',
                'message' => 'جميع الحقول المطلوبة يجب ملؤها'
            ];
        }
        
        // Validate email format if provided
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 'error',
                'message' => 'صيغة البريد الإلكتروني غير صحيحة'
            ];
        }
        
        // Validate username format (alphanumeric only)
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط'
            ];
        }
        
        // Validate password strength (min 8 characters)
        if (strlen($password) < 8) {
            return [
                'status' => 'error',
                'message' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
            ];
        }
        
        // Check if username exists
        if (get_user_by_username($username)) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم مستخدم بالفعل'
            ];
        }
        
        // Check if email exists (if provided)
        if (!empty($email) && get_user_by_email($email)) {
            return [
                'status' => 'error',
                'message' => 'البريد الإلكتروني مستخدم بالفعل'
            ];
        }
        
        // Create new user
        $result = create_user($username, $name, $password, $email, $description);
        
        if ($result['status'] === 'success') {
            // Set session data for the new user
            $_SESSION['user_id'] = $result['user']['id'];
            $_SESSION['username'] = $result['user']['username'];
            $_SESSION['name'] = $result['user']['name'];
            $_SESSION['is_admin'] = $result['user']['is_admin'];
            $_SESSION['description'] = $result['user']['description'];
        }
        
        return $result;
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'
        ];
    }
}
?>
EOT;

file_put_contents(__DIR__ . '/components/auth/register.php', $registerPhpContent);
echo "Updated register.php file.\n";

// Update session.php
$sessionPhpContent = <<<'EOT'
<?php
/**
 * Session management functions using CSV files
 */

/**
 * Check if user is logged in
 * 
 * @return bool Whether user is logged in
 */
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Check if current user is admin
 * 
 * @return bool Whether current user is admin
 */
function is_admin() {
    return is_logged_in() && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

/**
 * Verify user session against CSV data
 * 
 * @return bool Whether session is valid
 */
function verify_session() {
    if (!is_logged_in()) {
        return false;
    }
    
    try {
        $user = get_user_by_id($_SESSION['user_id']);
        
        // If user doesn't exist, invalidate session
        if (!$user) {
            session_unset();
            session_destroy();
            return false;
        }
        
        // Update session data in case user data has changed
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        $_SESSION['description'] = $user['description'] ?? '';
        
        return true;
    } catch (Exception $e) {
        error_log("Session verification error: " . $e->getMessage());
        // On error, rely on session data
        return true;
    }
}

/**
 * Require user to be logged in
 * Redirects to login page if not logged in
 */
function require_login() {
    if (!is_logged_in()) {
        header('Location: index.html');
        exit;
    }
}

/**
 * Require user to be admin
 * Redirects to login page if not admin
 */
function require_admin() {
    if (!is_admin()) {
        header('Location: index.html');
        exit;
    }
}
?>
EOT;

file_put_contents(__DIR__ . '/components/auth/session.php', $sessionPhpContent);
echo "Updated session.php file.\n";

// Update save_mood.php
$saveMoodPhpContent = <<<'EOT'
<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/csv_handler.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً']);
    exit;
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'طريقة طلب غير صالحة']);
    exit;
}

// Get user inputs
$user_id = $_SESSION['user_id'];
$primary_mood = isset($_POST['primary_mood']) ? $_POST['primary_mood'] : null;
$specific_mood = isset($_POST['specific_mood']) ? $_POST['specific_mood'] : null;
$reason = isset($_POST['reason']) ? $_POST['reason'] : null;
$activity = isset($_POST['activity']) ? $_POST['activity'] : null;
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';

// Validate inputs
if (!$primary_mood || !$specific_mood || !$reason || !$activity) {
    echo json_encode(['success' => false, 'message' => 'جميع الحقول مطلوبة']);
    exit;
}

// Translate mood values to Arabic if needed
$moodTranslation = [
    'happy' => 'سعيد',
    'normal' => 'طبيعي',
    'unhappy' => 'حزين'
];

// Use translated values if available
$primary_mood = isset($moodTranslation[$primary_mood]) ? $moodTranslation[$primary_mood] : $primary_mood;

try {
    // Save mood record using CSV handler
    $result = save_mood_record($user_id, $primary_mood, $specific_mood, $reason, $activity, $notes);
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'خطأ في حفظ البيانات: ' . $e->getMessage()]);
}
?>
EOT;

file_put_contents(__DIR__ . '/save_mood.php', $saveMoodPhpContent);
echo "Updated save_mood.php file.\n";

// Update get_moods.php
$getMoodsPhpContent = <<<'EOT'
<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/csv_handler.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get all mood records for the user
try {
    $records = get_mood_records($user_id);
    $statistics = get_mood_statistics($user_id);
    
    echo json_encode([
        'success' => true, 
        'records' => $records,
        'statistics' => $statistics
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()]);
}
?>
EOT;

file_put_contents(__DIR__ . '/get_moods.php', $getMoodsPhpContent);
echo "Updated get_moods.php file.\n";

echo "\nAll files have been updated to use CSV storage instead of a database.\n";
echo "Please run this script to set up the CSV-based system and then try accessing your application.\n";
?>

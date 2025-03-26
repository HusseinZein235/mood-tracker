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